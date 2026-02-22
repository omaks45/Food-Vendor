/* eslint-disable prettier/prettier */


import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min, IsBoolean, IsUrl } from 'class-validator';

export class UpdateFoodCategoryDto {
    @ApiPropertyOptional({
        example: 'Jollof Rice and Entrees',
        description: 'Category name',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: 'Delicious Jollof rice served with your choice of protein and sides',
        description: 'Category description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        example: 'https://res.cloudinary.com/demo/image/upload/v1234/category.jpg',
        description: 'Category image URL',
    })
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether category is active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description: 'Display order',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    displayOrder?: number;
}