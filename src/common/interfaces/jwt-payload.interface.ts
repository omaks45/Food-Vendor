/* eslint-disable prettier/prettier */
import { UserRole } from '../enums';

export interface JwtPayload {
    sub: string; // userId
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}