import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest>();

    const sessionToken =
      request.cookies?.resume_forge_session;

    if (!sessionToken) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    const user = await this.authService.validateSession(
      sessionToken,
    );

    (request as FastifyRequest & { user: typeof user }).user =
      user;

    return true;
  }
}