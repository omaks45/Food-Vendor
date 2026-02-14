/* eslint-disable prettier/prettier */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AppConstants } from '../constants';

export class PaginationDto {
    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = AppConstants.PAGINATION.DEFAULT_PAGE;

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(AppConstants.PAGINATION.MAX_LIMIT)
    @IsOptional()
    limit?: number = AppConstants.PAGINATION.DEFAULT_LIMIT;
}