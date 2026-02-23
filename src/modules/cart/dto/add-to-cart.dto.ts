/* eslint-disable prettier/prettier */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsInt,
    Min,
    IsOptional,
    IsEnum,
    IsArray,
    MaxLength,
    IsMongoId,
} from 'class-validator';

enum ProteinType {
    FRIED_CHICKEN = 'FRIED_CHICKEN',
    GRILLED_FISH = 'GRILLED_FISH',
    BEEF = 'BEEF',
}

enum ExtraSideType {
    FRIED_PLANTAIN = 'FRIED_PLANTAIN',
    COLESLAW = 'COLESLAW',
    EXTRA_PEPPER_SAUCE = 'EXTRA_PEPPER_SAUCE',
}

export class AddToCartDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Food item ID',
    })
    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    foodItemId: string;

    @ApiProperty({
        example: 2,
        description: 'Quantity of items',
        default: 1,
    })
    @IsInt()
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number;

    @ApiPropertyOptional({
        enum: ProteinType,
        example: ProteinType.FRIED_CHICKEN,
        description: 'Selected protein (for Jollof Rice items)',
    })
    @IsOptional()
    @IsEnum(ProteinType, { message: 'Invalid protein type' })
    selectedProtein?: ProteinType;

    @ApiPropertyOptional({
        enum: ExtraSideType,
        isArray: true,
        example: [ExtraSideType.FRIED_PLANTAIN, ExtraSideType.COLESLAW],
        description: 'Selected extra sides (for Jollof Rice items)',
    })
    @IsOptional()
    @IsArray()
    @IsEnum(ExtraSideType, { each: true, message: 'Invalid extra side type' })
    selectedExtraSides?: ExtraSideType[];

    @ApiPropertyOptional({
        example: 'Please make it extra spicy!',
        description: 'Special message for the vendor',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Message must not exceed 500 characters' })
    customerMessage?: string;
}