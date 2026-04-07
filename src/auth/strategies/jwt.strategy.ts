import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // User ID
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    console.log(`[JwtStrategy] Validating payload for user ID:`, payload.sub);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.warn(`[JwtStrategy] User not found for ID:`, payload.sub);
      throw new UnauthorizedException('User account not found');
    }

    if (!user.isActive) {
      console.warn(`[JwtStrategy] User is inactive:`, user.email);
      throw new UnauthorizedException('User account is inactive');
    }

    // Return the user data to be attached to request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
