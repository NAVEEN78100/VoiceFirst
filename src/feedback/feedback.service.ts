/** Feedback Service - Audited with Metadata Tracking */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '../events/events.constants';
import { FeedbackSubmittedPayload } from '../events/interfaces/feedback-submitted.payload';
import { MessageStatus, Role, Prisma } from '@prisma/client';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import axios from 'axios';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submitFeedback(dto: CreateFeedbackDto, req: Request) {
    let messageLog: { id: string; phone: string; touchpointId: string; token: string } | null = null;
    if (dto.messageToken) {
      messageLog = await this.prisma.messageLog.findUnique({
        where: { token: dto.messageToken },
        select: { id: true, phone: true, touchpointId: true, token: true },
      });

      if (!messageLog) {
        throw new NotFoundException('Invalid messaging token.');
      }
    }

    // 1. Efficient Touchpoint Lookup Validation
    let touchpoint: { id: string; branchId: string; isActive: boolean } | null = null;
    if (dto.touchpointToken) {
      touchpoint = await this.prisma.touchpoint.findUnique({
        where: { token: dto.touchpointToken },
        select: { id: true, branchId: true, isActive: true },
      });
    }

    if (!touchpoint && messageLog) {
      touchpoint = await this.prisma.touchpoint.findUnique({
        where: { id: messageLog.touchpointId },
        select: { id: true, branchId: true, isActive: true },
      });
    }

    if (!touchpoint || !touchpoint.isActive) {
      throw new NotFoundException('Invalid or inactive routing touchpoint constraint.');
    }

    // Metadata Extraction
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const maskedIp = this.maskIp(ip);

    // Geolocation (Non-blocking)
    const geoData = await this.getGeoLocation(ip);

    // 2. High-Frequency Native Insertion
    const feedback = await this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        phone: dto.phone || messageLog?.phone,
        touchpoint: { connect: { id: touchpoint.id } },
        branch: { connect: { id: touchpoint.branchId } },
        ipAddress: maskedIp,
        userAgent: userAgent,
        deviceType: uaResult.device.type || null,
        browser: uaResult.browser.name || null,
        os: uaResult.os.name || null,
        country: geoData.country || null,
        city: geoData.city || null,
      } as any,
    });

    if (messageLog) {
      await this.prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: MessageStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    }

    // 3. Emit a strongly-typed, PII-safe event payload.
    const payload: FeedbackSubmittedPayload = {
      feedbackId: feedback.id,
      rating: feedback.rating,
      touchpointId: feedback.touchpointId,
      branchId: feedback.branchId,
      hasPhone: !!feedback.phone,
      submittedAt: feedback.createdAt.toISOString(),
    };

    this.eventEmitter.emit(EVENTS.FEEDBACK_SUBMITTED, payload);

    // 4. Closed-Loop Recovery Logic (Delta Calculation)
    if (dto.caseId) {
      this.calculateRecoveryMetrics(dto.caseId, dto.rating);
    }

    return {
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id,
    };
  }

  private maskIp(ip: string): string {
    if (!ip) return '';
    // Mask IPv4: 1.2.3.4 -> 1.2.3.0
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    // Mask IPv6: partial mask
    if (ip.includes(':')) {
      return ip.split(':').slice(0, 4).join(':') + '::';
    }
    return ip;
  }

  private async getGeoLocation(ip: string): Promise<{ country?: string; city?: string }> {
    try {
      // Don't use mock placeholders for localhost; let it fail or return empty for real data integrity
      if (ip === '::1' || ip === '127.0.0.1') {
        return {};
      }
      const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,city`, { timeout: 2000 });
      if (response.data && response.data.status === 'success') {
        return { country: response.data.country, city: response.data.city };
      }
    } catch (err) {
      console.warn(`[FeedbackService] Geolocation failed for IP ${ip}: ${err.message}`);
    }
    return {};
  }

  async getFeedbackExplorer(
    user: { id: string; role: Role; branchId?: string },
    params: {
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
      rating?: number;
      branchId?: string;
      hasCase?: boolean;
      search?: string;
    },
  ) {
    const { page = 1, limit = 10, startDate, endDate, rating, branchId, hasCase, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC Enforcement
    if (user.role === Role.MANAGER) {
      where.branchId = user.branchId;
    } else if (user.role === Role.ADMIN || user.role === Role.CX) {
      if (branchId) {
        where.branchId = branchId;
      }
    } else {
      throw new ForbiddenException('You do not have permission to view feedback explorer.');
    }

    // Filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (rating) {
      where.rating = Number(rating);
    }

    if (hasCase !== undefined) {
      where.case = hasCase ? { isNot: null } : { is: null };
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true } },
          touchpoint: { select: { name: true, type: true } },
          case: { select: { id: true, status: true, priority: true } },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async calculateRecoveryMetrics(caseId: string, recoveryRating: number) {
    try {
      const existingCase = await this.prisma.case.findUnique({
        where: { id: caseId },
        select: { initialRating: true }
      });

      if (existingCase) {
        const delta = recoveryRating - existingCase.initialRating;
        await this.prisma.case.update({
          where: { id: caseId },
          data: {
            followUpRating: recoveryRating,
            recoveryDelta: delta
          }
        });
      }
    } catch (err) {
      // Recovery metrics are non-critical data; we log but don't fail feedback submission.
      console.error(`[FeedbackService] Failed to calculate recovery delta: ${err}`);
    }
  }
}
