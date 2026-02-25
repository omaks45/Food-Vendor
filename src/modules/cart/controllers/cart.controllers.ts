/* eslint-disable prettier/prettier */

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
//import { Public } from '@prisma/client/runtime/library';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
    constructor(private readonly cartService: CartService) {}

    /**
     * Add item to cart 
    */
    @Post('items')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiResponse({
        status: 201,
        description: 'Item added to cart successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Food item unavailable or invalid selections',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async addToCart(
        @CurrentUser('userId') userId: string,
        @Body() addToCartDto: AddToCartDto,
    ) {
        return this.cartService.addToCart(userId, addToCartDto);
    }

    /**
     * Get user's cart
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get current user cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    async getCart(@CurrentUser('userId') userId: string) {
        return this.cartService.getCart(userId);
    }

    /**
     * 
     * Get cart item count (for badge)
     */
    @Get('count')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get cart item count' })
    @ApiResponse({
        status: 200,
        description: 'Cart count retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    async getCartItemCount(@CurrentUser('userId') userId: string) {
        return this.cartService.getCartItemCount(userId);
    }

    /**
     * Update cart item
     */
    @Patch('items/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update cart item (quantity, protein, sides, message)' })
    @ApiResponse({
        status: 200,
        description: 'Cart item updated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid selections',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 404,
        description: 'Cart item not found',
    })
    async updateCartItem(
        @CurrentUser('userId') userId: string,
        @Param('id') cartItemId: string,
        @Body() updateCartItemDto: UpdateCartItemDto,
    ) {
        return this.cartService.updateCartItem(userId, cartItemId, updateCartItemDto);
    }

    /**
     * Remove item from cart
     */
    @Delete('items/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiResponse({
        status: 200,
        description: 'Item removed from cart successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 404,
        description: 'Cart item not found',
    })
    async removeCartItem(
        @CurrentUser('userId') userId: string,
        @Param('id') cartItemId: string,
    ) {
        return this.cartService.removeCartItem(userId, cartItemId);
    }

    /**
     * Clear entire cart
     */
    @Delete()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Clear entire cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart cleared successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    async clearCart(@CurrentUser('userId') userId: string) {
        return this.cartService.clearCart(userId);
    }
}