/* eslint-disable prettier/prettier */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
    @ApiProperty({
        enum: OrderStatus,
        example: OrderStatus.CONFIRMED,
        description: 'New order status',
    })
    @IsEnum(OrderStatus, { message: 'Invalid order status' })
    status: OrderStatus;

    @ApiPropertyOptional({
        example: 'Customer requested cancellation',
        description: 'Reason for cancellation (required if status is CANCELLED)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    cancellationReason?: string;
}