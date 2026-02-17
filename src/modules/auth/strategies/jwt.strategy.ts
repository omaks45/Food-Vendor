/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
        }

        // Verify user still exists
        const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
        },
        });

        if (!user || !user.isEmailVerified) {
        throw new UnauthorizedException('User not found or not verified');
        }

        return {
        userId: user.id,
        email: user.email,
        role: user.role,
        };
    }
}