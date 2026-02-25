/* eslint-disable prettier/prettier */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { ErrorCodes } from '@/common/constants';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    // Pricing constants
    private readonly DELIVERY_FEE = 500; // ₦500 flat delivery fee
    private readonly SERVICE_FEE_PERCENTAGE = 0.05; // 5% service fee
    private readonly TAX_PERCENTAGE = 0.075; // 7.5% VAT

    constructor(private prisma: PrismaService) {}

    /**
     * Create new order from cart
     * Requires authentication
     */
    async createOrder(userId: string, createOrderDto: CreateOrderDto) {
        const {
        addressId,
        contactNumber,
        paymentMethod,
        deliveryTime,
        deliveryInstructions,
        customerInstructions,
        promoCode,
        } = createOrderDto;

        // 1. Get user's cart
        const cart = await this.prisma.cart.findUnique({
        where: { userId },
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

        if (!cart || cart.items.length === 0) {
        throw new BadRequestException({
            code: ErrorCodes.CART_EMPTY,
            message: 'Cannot create order from empty cart',
        });
        }

        // 2. Validate address belongs to user
        const address = await this.prisma.address.findUnique({
        where: { id: addressId },
        });

        if (!address) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Delivery address not found',
        });
        }

        if (address.userId !== userId) {
        throw new ForbiddenException({
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only use your own addresses',
        });
        }

        // 3. Validate all cart items are still available
        for (const item of cart.items) {
        if (!item.foodItem.isAvailable) {
            throw new BadRequestException({
            code: ErrorCodes.RESOURCE_UNAVAILABLE,
            message: `${item.foodItem.name} is no longer available`,
            });
        }
        }

        // 4. Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
        return sum + item.unitPrice * item.quantity;
        }, 0);

        const serviceFee = subtotal * this.SERVICE_FEE_PERCENTAGE;
        const deliveryFee = this.DELIVERY_FEE;

        // 5. Apply promo code discount if provided
        let discount = 0;
        let promoCodeUsed: string | null = null;

        if (promoCode) {
        const referralCode = await this.prisma.referralCode.findFirst({
            where: {
            code: promoCode,
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
            },
        });

        if (referralCode) {
            // Check usage limits
            if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
            throw new BadRequestException({
                code: ErrorCodes.PROMO_CODE_EXHAUSTED,
                message: 'This promo code has reached its usage limit',
            });
            }

            // Calculate discount
            if (referralCode.discountType === 'PERCENTAGE') {
            discount = subtotal * (referralCode.discountValue / 100);
            } else {
            discount = referralCode.discountValue;
            }

            // Discount cannot exceed subtotal
            discount = Math.min(discount, subtotal);
            promoCodeUsed = promoCode;
        } else {
            throw new BadRequestException({
            code: ErrorCodes.INVALID_PROMO_CODE,
            message: 'Invalid or expired promo code',
            });
        }
        }

        // 6. Calculate tax on (subtotal - discount + fees)
        const taxableAmount = subtotal - discount + serviceFee + deliveryFee;
        const tax = taxableAmount * this.TAX_PERCENTAGE;

        // 7. Calculate final total
        const total = subtotal + serviceFee + deliveryFee + tax - discount;

        // 8. Generate unique order number
        const orderNumber = await this.generateOrderNumber();

        // 9. Create order with transaction
        const order = await this.prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
            data: {
            orderNumber,
            userId,
            addressId,
            contactNumber,
            paymentMethod,
            deliveryTime: deliveryTime ? new Date(deliveryTime) : null,
            deliveryInstructions,
            customerInstructions,
            promoCode: promoCodeUsed,
            subtotal,
            deliveryFee,
            serviceFee,
            tax,
            discount,
            total,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            },
            include: {
            address: true,
            user: {
                select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                },
            },
            },
        });

        // Create order items from cart items
        for (const cartItem of cart.items) {
            await tx.orderItem.create({
            data: {
                orderId: newOrder.id,
                foodItemId: cartItem.foodItemId,
                foodName: cartItem.foodItem.name,
                foodImage: cartItem.foodItem.imageUrl,
                quantity: cartItem.quantity,
                unitPrice: cartItem.unitPrice,
                totalPrice: cartItem.unitPrice * cartItem.quantity,
                selectedProtein: cartItem.selectedProtein,
                selectedExtraSides: cartItem.selectedExtraSides || [],
                customerMessage: cartItem.customerMessage,
            },
            });
        }

        // Increment promo code usage if used
        if (promoCodeUsed) {
            await tx.referralCode.updateMany({
            where: { code: promoCodeUsed },
            data: { currentUses: { increment: 1 } },
            });
        }

        // Clear user's cart
        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return newOrder;
        });

        this.logger.log(`Order created: ${orderNumber} by user ${userId}`);

        // 10. Get complete order with items
        return this.getOrderById(userId, order.id);
    }

    /**
     * Get user's orders with pagination
     */
    async getUserOrders(
        userId: string,
        params?: {
        status?: string;
        page?: number;
        limit?: number;
        },
    ) {
        const { status, page = 1, limit = 10 } = params || {};
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (status) {
        where.status = status;
        }

        const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
            where,
            include: {
            address: true,
            items: {
                include: {
                foodItem: {
                    select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                    },
                },
                },
            },
            _count: {
                select: { items: true },
            },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        this.prisma.order.count({ where }),
        ]);

        return {
        success: true,
        message: 'Orders retrieved successfully',
        data: {
            orders,
            pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            },
        },
        };
    }

    /**
     * Get single order by ID
     */
    async getOrderById(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            address: true,
            user: {
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
            },
            },
            items: {
            include: {
                foodItem: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                    category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                    },
                },
                },
            },
            },
        },
        });

        if (!order) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Order not found',
        });
        }

        // Verify order belongs to user
        if (order.userId !== userId) {
        throw new ForbiddenException({
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only view your own orders',
        });
        }

        return {
        success: true,
        message: 'Order retrieved successfully',
        data: order,
        };
    }

    /**
     * Get order by order number
     */
    async getOrderByNumber(userId: string, orderNumber: string) {
        const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
            address: true,
            items: {
            include: {
                foodItem: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                },
                },
            },
            },
        },
        });

        if (!order) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Order not found',
        });
        }

        if (order.userId !== userId) {
        throw new ForbiddenException({
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only view your own orders',
        });
        }

        return {
        success: true,
        message: 'Order retrieved successfully',
        data: order,
        };
    }

    /**
     * Cancel order (customer)
     */
    async cancelOrder(userId: string, orderId: string, cancelOrderDto: CancelOrderDto) {
        const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        });

        if (!order) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Order not found',
        });
        }

        if (order.userId !== userId) {
        throw new ForbiddenException({
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only cancel your own orders',
        });
        }

        // Can only cancel PENDING or CONFIRMED orders
        if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new BadRequestException({
            code: ErrorCodes.INVALID_ORDER_STATUS,
            message: 'Cannot cancel order in current status',
        });
        }

        const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: cancelOrderDto.reason,
        },
        include: {
            items: true,
            address: true,
        },
        });

        this.logger.log(`Order cancelled: ${order.orderNumber} by customer`);

        return {
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder,
        };
    }

    /**
     * Update order status (Admin only)
     */
    async updateOrderStatus(
        orderId: string,
        updateStatusDto: UpdateOrderStatusDto,
        adminId: string,
    ) {
        const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        });

        if (!order) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Order not found',
        });
        }

        // Validate status transition
        this.validateStatusTransition(order.status, updateStatusDto.status);

        const updateData: any = {
        status: updateStatusDto.status,
        };

        // Set timestamps based on status
        if (updateStatusDto.status === 'CONFIRMED') {
        updateData.confirmedAt = new Date();
        } else if (updateStatusDto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        } else if (updateStatusDto.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = adminId;
        updateData.cancellationReason =
            updateStatusDto.cancellationReason || 'Cancelled by admin';
        }

        const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
            items: true,
            address: true,
            user: {
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
            },
        },
        });

        this.logger.log(
        `Order ${order.orderNumber} status updated to ${updateStatusDto.status} by admin`,
        );

        return {
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder,
        };
    }

    /**
     * Get all orders (Admin only)
     */
    async getAllOrders(params?: {
        status?: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }) {
        const { status, page = 1, limit = 20, startDate, endDate } = params || {};
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
        where.status = status;
        }

        if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
            where,
            include: {
            user: {
                select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                },
            },
            address: true,
            items: {
                include: {
                foodItem: {
                    select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    },
                },
                },
            },
            _count: {
                select: { items: true },
            },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        this.prisma.order.count({ where }),
        ]);

        return {
        success: true,
        message: 'Orders retrieved successfully',
        data: {
            orders,
            pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            },
        },
        };
    }

    /**
     * Get order statistics (Admin only)
     */
    async getOrderStatistics() {
        const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        preparingOrders,
        outForDeliveryOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        todayOrders,
        ] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.order.count({ where: { status: 'PREPARING' } }),
        this.prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
        this.prisma.order.count({ where: { status: 'COMPLETED' } }),
        this.prisma.order.count({ where: { status: 'CANCELLED' } }),
        this.prisma.order.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { total: true },
        }),
        this.prisma.order.count({
            where: {
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            },
        }),
        ]);

        return {
        success: true,
        message: 'Order statistics retrieved successfully',
        data: {
            totalOrders,
            statusBreakdown: {
            pending: pendingOrders,
            confirmed: confirmedOrders,
            preparing: preparingOrders,
            outForDelivery: outForDeliveryOrders,
            completed: completedOrders,
            cancelled: cancelledOrders,
            },
            revenue: {
            total: totalRevenue._sum.total || 0,
            },
            today: {
            orders: todayOrders,
            },
        },
        };
    }

    // ---------------------------------------------------------------------------
    // PRIVATE HELPERS
    // ---------------------------------------------------------------------------

    /**
     * Generate unique order number
     */
    private async generateOrderNumber(): Promise<string> {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
        const orderNumber = `CK${timestamp}${random}`;

        // Ensure uniqueness
        const exists = await this.prisma.order.findUnique({
        where: { orderNumber },
        });

        if (exists) {
        return this.generateOrderNumber(); // Retry
        }

        return orderNumber;
    }

    /**
     * Validate order status transitions
     */
    private validateStatusTransition(currentStatus: string, newStatus: string) {
        const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
        OUT_FOR_DELIVERY: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [], // Cannot transition from completed
        CANCELLED: [], // Cannot transition from cancelled
        };

        const allowed = validTransitions[currentStatus] || [];

        if (!allowed.includes(newStatus)) {
        throw new BadRequestException({
            code: ErrorCodes.INVALID_STATUS_TRANSITION,
            message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        });
        }
    }
}