/* eslint-disable prettier/prettier */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CancelOrderDto {
    @ApiProperty({
        example: 'Changed my mind about the order',
        description: 'Reason for cancelling the order',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500, { message: 'Cancellation reason must not exceed 500 characters' })
    reason: string;
}