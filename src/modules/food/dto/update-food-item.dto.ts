/* eslint-disable prettier/prettier */
// src/modules/food/dto/update-food-item.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    MinLength,
    MaxLength,
    IsNumber,
    Min,
    IsBoolean,
    IsOptional,
    IsMongoId,
} from 'class-validator';

export class UpdateFoodItemDto {
    @ApiPropertyOptional({
        example: '507f1f77bcf86cd799439011',
        description: 'Category ID (MongoDB ObjectId)',
    })
    @IsOptional()
    @IsString()
    @IsMongoId()
    categoryId?: string;

    @ApiPropertyOptional({
        example: 'Jollof Rice Special',
        description: 'Food item name',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: 'Delicious Nigerian Jollof rice cooked to perfection with aromatic spices',
        description: 'Food item description',
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({
        example: 2500,
        description: 'Base price in Naira',
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    basePrice?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customers to choose protein',
    })
    @IsOptional()
    @IsBoolean()
    allowProteinChoice?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customers to add extra sides',
    })
    @IsOptional()
    @IsBoolean()
    allowExtraSides?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether item is available for order',
    })
    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Featured on homepage',
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow customer to leave message',
    })
    @IsOptional()
    @IsBoolean()
    allowCustomerMessage?: boolean;
}