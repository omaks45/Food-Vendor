/* eslint-disable prettier/prettier */


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsMongoId,
    MaxLength,
    IsPhoneNumber,
    IsDateString,
} from 'class-validator';

enum PaymentMethod {
    CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    WALLET = 'WALLET',
}

export class CreateOrderDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Delivery address ID',
    })
    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    addressId: string;

    @ApiProperty({
        example: '+2348012345678',
        description: 'Contact phone number for delivery',
    })
    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('NG', { message: 'Please provide a valid Nigerian phone number' })
    contactNumber: string;

    @ApiProperty({
        enum: PaymentMethod,
        example: PaymentMethod.CASH_ON_DELIVERY,
        description: 'Payment method',
    })
    @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({
        example: '2026-02-22T14:00:00Z',
        description: 'Preferred delivery time (optional)',
    })
    @IsOptional()
    @IsDateString()
    deliveryTime?: string;

    @ApiPropertyOptional({
        example: 'Please ring the doorbell twice',
        description: 'Delivery instructions',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    deliveryInstructions?: string;

    @ApiPropertyOptional({
        example: 'Please make all dishes extra spicy',
        description: 'General customer instructions for the kitchen',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    customerInstructions?: string;

    @ApiPropertyOptional({
        example: 'SAVE10',
        description: 'Promo code for discount',
    })
    @IsOptional()
    @IsString()
    promoCode?: string;
}