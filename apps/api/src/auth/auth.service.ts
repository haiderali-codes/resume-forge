import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const passwordHash = await argon2.hash(
      registerDto.password,
      {
        type: argon2.argon2id,
      },
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: registerDto.firstName?.trim() || null,
        lastName: registerDto.lastName?.trim() || null,
      },
    });

    return this.toSafeUser(user);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const sessionToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 30,
    );

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: this.toSafeUser(user),
      sessionToken,
      expiresAt,
    };
  }

  async validateSession(sessionToken: string) {
    const tokenHash = createHash('sha256')
        .update(sessionToken)
        .digest('hex');

    const session = await this.prisma.userSession.findUnique({
        where: {
        tokenHash,
        },
        include: {
        user: true,
        },
    });

    if (
        !session ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        !session.user.isActive
    ) {
        throw new UnauthorizedException('Invalid or expired session');
    }

    return this.toSafeUser(session.user);
 }

 async logout(sessionToken: string): Promise<void> {
    const tokenHash = createHash('sha256')
        .update(sessionToken)
        .digest('hex');

    await this.prisma.userSession.updateMany({
        where: {
        tokenHash,
        revokedAt: null,
        },
        data: {
        revokedAt: new Date(),
        },
    });
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}