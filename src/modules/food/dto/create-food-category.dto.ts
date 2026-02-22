/* eslint-disable prettier/prettier */
export class CreateFoodDto {}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFoodCategoryDto {
    @ApiProperty({
        example: 'Jollof Rice and Entrees',
        description: 'Category name',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        example: 'Delicious Jollof rice served with your choice of protein and sides',
        description: 'Category description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;


    @ApiPropertyOptional({
        example: 1,
        description: 'Display order (lower numbers appear first)',
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    displayOrder?: number;
}