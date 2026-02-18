/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateAddressDto {
    @ApiProperty({ example: '15' })
    @IsString()
    @MinLength(1)
    number: string;

    @ApiProperty({ example: 'Ademola Adetokunbo Street' })
    @IsString()
    @MinLength(3)
    street: string;

    @ApiProperty({ example: 'Victoria Island' })
    @IsString()
    @MinLength(2)
    city: string;

    @ApiProperty({ example: 'Lagos' })
    @IsString()
    @MinLength(2)
    state: string;

    @ApiPropertyOptional({ example: 'Home' })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}