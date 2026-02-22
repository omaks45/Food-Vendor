/* eslint-disable prettier/prettier */
// src/modules/food/dto/create-food-item.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    IsNumber,
    Min,
    IsBoolean,
    IsOptional,
    IsMongoId,
} from 'class-validator';

export class CreateFoodItemDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Category ID (MongoDB ObjectId)',
    })
    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    categoryId: string;

    @ApiProperty({
        example: 'Jollof Rice Special',
        description: 'Food item name',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        example: 'Delicious Nigerian Jollof rice cooked to perfection with aromatic spices',
        description: 'Food item description',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(1000)
    description: string;

    @ApiProperty({
        example: 2500,
        description: 'Base price in Naira (without protein or extras)',
    })
    @IsNumber()
    @Min(0)
    basePrice: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customers to choose protein (for Jollof Rice category)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    allowProteinChoice?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customers to add extra sides (for Jollof Rice category)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    allowExtraSides?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether item is available for order',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Featured on homepage',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customer to leave message for vendor',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    allowCustomerMessage?: boolean;
}