"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const events_constants_1 = require("../events/events.constants");
const client_1 = require("@prisma/client");
const ua_parser_js_1 = require("ua-parser-js");
const axios_1 = __importDefault(require("axios"));
let FeedbackService = class FeedbackService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async submitFeedback(dto, req) {
        let messageLog = null;
        if (dto.messageToken) {
            messageLog = await this.prisma.messageLog.findUnique({
                where: { token: dto.messageToken },
                select: { id: true, phone: true, touchpointId: true, token: true },
            });
            if (!messageLog) {
                throw new common_1.NotFoundException('Invalid messaging token.');
            }
        }
        let touchpoint = null;
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
            throw new common_1.NotFoundException('Invalid or inactive routing touchpoint constraint.');
        }
        const userAgent = req.headers['user-agent'] || '';
        const parser = new ua_parser_js_1.UAParser(userAgent);
        const uaResult = parser.getResult();
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const maskedIp = this.maskIp(ip);
        const geoData = await this.getGeoLocation(ip);
        const feedback = await this.prisma.feedback.create({
            data: {
                rating: dto.rating,
                comment: dto.comment,
                issueTopic: dto.issueTopic,
                serviceCategory: dto.serviceCategory,
                issueTags: dto.issueTags,
                followUpRequested: dto.followUpRequested ?? false,
                trackType: dto.trackType ?? 'ANONYMOUS',
                channel: dto.channel ?? 'QR',
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
            },
        });
        if (messageLog) {
            await this.prisma.messageLog.update({
                where: { id: messageLog.id },
                data: {
                    status: client_1.MessageStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });
        }
        const payload = {
            feedbackId: feedback.id,
            rating: feedback.rating,
            touchpointId: feedback.touchpointId,
            branchId: feedback.branchId,
            hasPhone: !!feedback.phone,
            issueTopic: feedback.issueTopic || undefined,
            commentPreview: feedback.comment ? (feedback.comment.length > 50 ? feedback.comment.substring(0, 50) + '...' : feedback.comment) : '',
            submittedAt: feedback.createdAt.toISOString(),
        };
        this.eventEmitter.emit(events_constants_1.EVENTS.FEEDBACK_SUBMITTED, payload);
        if (dto.caseId) {
            this.calculateRecoveryMetrics(dto.caseId, dto.rating, dto.comment);
        }
        let perkPointsAwarded = 0;
        let totalPerkPoints = 0;
        if (feedback.phone) {
            perkPointsAwarded = 50;
            const customer = await this.prisma.customer.upsert({
                where: { phone: feedback.phone },
                update: {
                    perkPoints: { increment: perkPointsAwarded },
                    lastAwardedAt: new Date(),
                },
                create: {
                    phone: feedback.phone,
                    perkPoints: perkPointsAwarded,
                    lastAwardedAt: new Date(),
                }
            });
            totalPerkPoints = customer.perkPoints;
        }
        return {
            message: 'Feedback submitted successfully',
            feedbackId: feedback.id,
            perkPointsAwarded,
            totalPerkPoints
        };
    }
    async getTouchpointContext(token) {
        const touchpoint = await this.prisma.touchpoint.findUnique({
            where: { token },
            include: {
                branch: {
                    select: { name: true, location: true }
                }
            }
        });
        if (!touchpoint || !touchpoint.isActive) {
            throw new common_1.NotFoundException('Invalid or inactive routing touchpoint constraint.');
        }
        return {
            name: touchpoint.name,
            type: touchpoint.type,
            branch: touchpoint.branch
        };
    }
    maskIp(ip) {
        if (!ip)
            return '';
        if (ip.includes('.')) {
            return ip.split('.').slice(0, 3).join('.') + '.0';
        }
        if (ip.includes(':')) {
            return ip.split(':').slice(0, 4).join(':') + '::';
        }
        return ip;
    }
    async getGeoLocation(ip) {
        try {
            if (ip === '::1' || ip === '127.0.0.1') {
                return {};
            }
            const response = await axios_1.default.get(`http://ip-api.com/json/${ip}?fields=status,message,country,city`, { timeout: 2000 });
            if (response.data && response.data.status === 'success') {
                return { country: response.data.country, city: response.data.city };
            }
        }
        catch (err) {
            console.warn(`[FeedbackService] Geolocation failed for IP ${ip}: ${err.message}`);
        }
        return {};
    }
    async getFeedbackExplorer(user, params) {
        const { page = 1, limit = 10, startDate, endDate, rating, branchId, hasCase, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (user.role === client_1.Role.MANAGER) {
            where.branchId = user.branchId;
        }
        else if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.CX) {
            if (branchId) {
                where.branchId = branchId;
            }
        }
        else {
            throw new common_1.ForbiddenException('You do not have permission to view feedback explorer.');
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
    async calculateRecoveryMetrics(caseId, recoveryRating, comment) {
        try {
            const existingCase = await this.prisma.case.findUnique({
                where: { id: caseId },
                select: { initialRating: true }
            });
            if (existingCase) {
                const delta = recoveryRating - existingCase.initialRating;
                await this.prisma.$transaction([
                    this.prisma.recoveryFeedback.create({
                        data: {
                            caseId,
                            newRating: recoveryRating,
                            comment: comment,
                        }
                    }),
                    this.prisma.case.update({
                        where: { id: caseId },
                        data: {
                            followUpRating: recoveryRating,
                            recoveryDelta: delta,
                            status: 'RESOLVED'
                        }
                    })
                ]);
            }
        }
        catch (err) {
            console.warn(`[FeedbackService] Recovery error: ${err.message}`);
        }
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map