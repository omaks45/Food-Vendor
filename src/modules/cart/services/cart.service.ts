/* eslint-disable prettier/prettier */
// src/modules/cart/services/cart.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { ErrorCodes } from '@/common/constants';

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    // Pricing for protein options (additional cost)
    private readonly PROTEIN_PRICES = {
        FRIED_CHICKEN: 0, // Default - no extra charge
        GRILLED_FISH: 500,
        BEEF: 700,
    };

    // Pricing for extra sides
    private readonly EXTRA_SIDE_PRICES = {
        FRIED_PLANTAIN: 300,
        COLESLAW: 200,
        EXTRA_PEPPER_SAUCE: 100,
    };

    constructor(private prisma: PrismaService) {}

    /**
     * Add item to cart or update quantity if already exists
     */
    async addToCart(userId: string, addToCartDto: AddToCartDto) {
        const { foodItemId, quantity, selectedProtein, selectedExtraSides, customerMessage } =
        addToCartDto;

        // Verify food item exists and is available
        const foodItem = await this.prisma.foodItem.findUnique({
        where: { id: foodItemId },
        include: { category: true },
        });

        if (!foodItem) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Food item not found',
        });
        }

        if (!foodItem.isAvailable) {
        throw new BadRequestException({
            code: ErrorCodes.RESOURCE_UNAVAILABLE,
            message: 'This food item is currently unavailable',
        });
        }

        // Validate protein choice if provided
        if (selectedProtein && !foodItem.allowProteinChoice) {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Protein selection is not available for this item',
        });
        }

        // Validate extra sides if provided
        if (selectedExtraSides?.length > 0 && !foodItem.allowExtraSides) {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Extra sides are not available for this item',
        });
        }

        // Validate customer message if provided
        if (customerMessage && !foodItem.allowCustomerMessage) {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Customer messages are not allowed for this item',
        });
        }

        // Calculate unit price with extras
        const unitPrice = this.calculateUnitPrice(
        foodItem.basePrice,
        selectedProtein,
        selectedExtraSides,
        );

        // Get or create user's cart
        let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
        });

        if (!cart) {
        cart = await this.prisma.cart.create({
            data: { userId },
            include: { items: true },
        });
        }

        // Check if item with same configuration already exists
        const existingItem = await this.prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            foodItemId,
            selectedProtein,
            // Compare arrays properly
            selectedExtraSides: selectedExtraSides?.length > 0 
            ? { equals: selectedExtraSides } 
            : { isEmpty: true },
        },
        });

        let cartItem;

        if (existingItem) {
        // Update existing item quantity
        cartItem = await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
            quantity: existingItem.quantity + quantity,
            customerMessage: customerMessage || existingItem.customerMessage,
            },
            include: {
            foodItem: {
                include: { category: true },
            },
            },
        });

        this.logger.log(`Updated cart item quantity: ${foodItem.name} (${existingItem.id})`);
        } else {
        // Create new cart item
        cartItem = await this.prisma.cartItem.create({
            data: {
            cartId: cart.id,
            foodItemId,
            quantity,
            selectedProtein,
            selectedExtraSides: selectedExtraSides || [],
            customerMessage,
            unitPrice,
            },
            include: {
            foodItem: {
                include: { category: true },
            },
            },
        });

        this.logger.log(`Added to cart: ${foodItem.name} (${cartItem.id})`);
        }

        // Return updated cart
        return this.getCart(userId);
    }

    /**
     * Get user's cart with all items and totals
     */
    async getCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
            include: {
                foodItem: {
                include: { category: true },
                },
            },
            orderBy: { createdAt: 'asc' },
            },
        },
        });

        // Create cart if doesn't exist
        if (!cart) {
        cart = await this.prisma.cart.create({
            data: { userId },
            include: {
            items: {
                include: {
                foodItem: {
                    include: { category: true },
                },
                },
            },
            },
        });
        }

        // Calculate totals
        const cartWithTotals = this.calculateCartTotals(cart);

        return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cartWithTotals,
        };
    }

    /**
     * Update cart item (quantity, protein, sides, message)
     */
    async updateCartItem(
        userId: string,
        cartItemId: string,
        updateCartItemDto: UpdateCartItemDto,
    ) {
        // Verify cart item belongs to user
        const cartItem = await this.findCartItemByIdOrFail(userId, cartItemId);

        const { quantity, selectedProtein, selectedExtraSides, customerMessage } =
        updateCartItemDto;

        // Verify food item still exists and is available
        const foodItem = await this.prisma.foodItem.findUnique({
        where: { id: cartItem.foodItemId },
        });

        if (!foodItem || !foodItem.isAvailable) {
        throw new BadRequestException({
            code: ErrorCodes.RESOURCE_UNAVAILABLE,
            message: 'This food item is no longer available',
        });
        }

        // Validate protein choice if being updated
        if (selectedProtein !== undefined && !foodItem.allowProteinChoice) {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Protein selection is not available for this item',
        });
        }

        // Validate extra sides if being updated
        if (selectedExtraSides !== undefined && !foodItem.allowExtraSides) {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Extra sides are not available for this item',
        });
        }

        // Recalculate unit price if protein or sides changed
        let unitPrice = cartItem.unitPrice;
        if (selectedProtein !== undefined || selectedExtraSides !== undefined) {
        unitPrice = this.calculateUnitPrice(
            foodItem.basePrice,
            selectedProtein ?? cartItem.selectedProtein,
            selectedExtraSides ?? cartItem.selectedExtraSides,
        );
        }

        // Update cart item
        const updatedItem = await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
            quantity,
            selectedProtein,
            selectedExtraSides,
            customerMessage,
            unitPrice,
        },
        include: {
            foodItem: {
            include: { category: true },
            },
        },
        });

        this.logger.log(`Updated cart item: ${updatedItem.foodItem.name} (${cartItemId})`);

        // Return updated cart
        return this.getCart(userId);
    }

    /**
     * Remove item from cart
     */
    async removeCartItem(userId: string, cartItemId: string) {
        // Verify cart item belongs to user
        await this.findCartItemByIdOrFail(userId, cartItemId);

        await this.prisma.cartItem.delete({
        where: { id: cartItemId },
        });

        this.logger.log(`Removed cart item: ${cartItemId}`);

        // Return updated cart
        return this.getCart(userId);
    }

    /**
     * Clear entire cart
     */
    async clearCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
        where: { userId },
        });

        if (!cart) {
        return {
            success: true,
            message: 'Cart is already empty',
            data: null,
        };
        }

        await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
        });

        this.logger.log(`Cleared cart for user: ${userId}`);

        return {
        success: true,
        message: 'Cart cleared successfully',
        data: null,
        };
    }

    /**
     * Get cart item count (for badge display)
     */
    async getCartItemCount(userId: string) {
        const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
            select: { quantity: true },
            },
        },
        });

        const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

        return {
        success: true,
        message: 'Cart item count retrieved',
        data: {
            itemCount: cart?.items.length || 0, // Unique items
            totalQuantity: totalItems, // Total quantity
        },
        };
    }

    // ---------------------------------------------------------------------------
    // PRIVATE HELPERS
    // ---------------------------------------------------------------------------

    /**
     * Find cart item by ID and verify ownership
     */
    private async findCartItemByIdOrFail(userId: string, cartItemId: string) {
        const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true },
        });

        if (!cartItem) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Cart item not found',
        });
        }

        if (cartItem.cart.userId !== userId) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Cart item not found',
        });
        }

        return cartItem;
    }

    /**
     * Calculate unit price with protein and extras
     */
    private calculateUnitPrice(
        basePrice: number,
        selectedProtein?: string,
        selectedExtraSides?: string[],
    ): number {
        let price = basePrice;

        // Add protein cost
        if (selectedProtein) {
        price += this.PROTEIN_PRICES[selectedProtein] || 0;
        }

        // Add extra sides cost
        if (selectedExtraSides?.length > 0) {
        selectedExtraSides.forEach((side) => {
            price += this.EXTRA_SIDE_PRICES[side] || 0;
        });
        }

        return price;
    }

    /**
     * Calculate cart totals
     */
    private calculateCartTotals(cart: any) {
        const items = cart.items || [];

        const subtotal = items.reduce((sum, item) => {
        return sum + item.unitPrice * item.quantity;
        }, 0);

        const itemCount = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        return {
        id: cart.id,
        userId: cart.userId,
        items: items.map((item) => ({
            id: item.id,
            foodItem: {
            id: item.foodItem.id,
            name: item.foodItem.name,
            slug: item.foodItem.slug,
            description: item.foodItem.description,
            imageUrl: item.foodItem.imageUrl,
            basePrice: item.foodItem.basePrice,
            category: item.foodItem.category,
            },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            selectedProtein: item.selectedProtein,
            selectedExtraSides: item.selectedExtraSides,
            customerMessage: item.customerMessage,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })),
        summary: {
            itemCount,
            totalQuantity,
            subtotal,
        },
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        };
    }
}