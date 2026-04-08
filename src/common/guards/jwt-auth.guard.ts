import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      if (err) console.error('[JwtAuthGuard] Error:', err);
      if (info) console.warn('[JwtAuthGuard] Info:', info);
      if (!user) console.warn('[JwtAuthGuard] User not found or token invalid');

      throw new UnauthorizedException(
        err?.message || info?.message || 'Invalid or expired authentication token',
      );
    }
    return user;
  }
}
