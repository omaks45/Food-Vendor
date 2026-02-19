/* eslint-disable prettier/prettier */
import { Request } from 'express';
import { UserRole } from '@/common/enums';

export interface RequestWithUser extends Request {
    user: {
        userId: string;
        email: string;
        role: UserRole;
    };
}