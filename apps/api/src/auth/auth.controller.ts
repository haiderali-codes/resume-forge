import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { SessionGuard } from './session.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const result = await this.authService.login(loginDto);

        reply.setCookie(
            'resume_forge_session',
            result.sessionToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                expires: result.expiresAt,
            },
        );

        return {
            user: result.user,
            expiresAt: result.expiresAt,
        };
    }

    @Get('me')
    @UseGuards(SessionGuard)
    getCurrentUser(
        @Req() request: FastifyRequest & {
            user?: unknown;
        },
    ) {
        return request.user;
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Req() request: FastifyRequest,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const sessionToken =
            request.cookies?.resume_forge_session;

        if (sessionToken) {
            await this.authService.logout(sessionToken);
        }

        reply.clearCookie('resume_forge_session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
}