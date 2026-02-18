/* eslint-disable prettier/prettier */
export class CreateUserDto {}
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword123!' })
    @IsString()
    @MinLength(1)
    currentPassword: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsString()
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
        'Password must contain uppercase, lowercase, number, and special character',
    })
    newPassword: string;
}