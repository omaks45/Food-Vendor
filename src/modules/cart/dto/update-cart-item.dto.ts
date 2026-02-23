/* eslint-disable prettier/prettier */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    Min,
    IsOptional,
    IsEnum,
    IsArray,
    IsString,
    MaxLength,
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

export class UpdateCartItemDto {
    @ApiPropertyOptional({
        example: 3,
        description: 'Updated quantity',
    })
    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity?: number;

    @ApiPropertyOptional({
        enum: ProteinType,
        example: ProteinType.GRILLED_FISH,
        description: 'Updated protein selection',
    })
    @IsOptional()
    @IsEnum(ProteinType, { message: 'Invalid protein type' })
    selectedProtein?: ProteinType;

    @ApiPropertyOptional({
        enum: ExtraSideType,
        isArray: true,
        example: [ExtraSideType.FRIED_PLANTAIN],
        description: 'Updated extra sides selection',
    })
    @IsOptional()
    @IsArray()
    @IsEnum(ExtraSideType, { each: true, message: 'Invalid extra side type' })
    selectedExtraSides?: ExtraSideType[];

    @ApiPropertyOptional({
        example: 'No onions please',
        description: 'Updated customer message',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Message must not exceed 500 characters' })
    customerMessage?: string;
}