/* eslint-disable prettier/prettier */

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    /**
     * Create new order from cart (Customer only)
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create order from cart (Customer only - Authentication required)' })
    @ApiResponse({
        status: 201,
        description: 'Order created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cart empty or items unavailable',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 404,
        description: 'Address not found',
    })
    async createOrder(
        @CurrentUser('userId') userId: string,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.orderService.createOrder(userId, createOrderDto);
    }

    /**
     * Get current user's orders (Customer)
     */
    @Get('my-orders')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get current user orders with pagination' })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
        status: 200,
        description: 'Orders retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    async getUserOrders(
        @CurrentUser('userId') userId: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.orderService.getUserOrders(userId, {
        status,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        });
    }

    /**
     * Get order by ID (Customer)
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get order details by ID' })
    @ApiResponse({
        status: 200,
        description: 'Order retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Not your order',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async getOrderById(
        @CurrentUser('userId') userId: string,
        @Param('id') orderId: string,
    ) {
        return this.orderService.getOrderById(userId, orderId);
    }

    /**
     * Get order by order number (Customer)
     */
    @Get('number/:orderNumber')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get order details by order number' })
    @ApiResponse({
        status: 200,
        description: 'Order retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Not your order',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async getOrderByNumber(
        @CurrentUser('userId') userId: string,
        @Param('orderNumber') orderNumber: string,
    ) {
        return this.orderService.getOrderByNumber(userId, orderNumber);
    }

    /**
     * Cancel order (Customer)
     */
    @Patch(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel order (only PENDING or CONFIRMED orders)' })
    @ApiResponse({
        status: 200,
        description: 'Order cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot cancel order in current status',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Login required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Not your order',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async cancelOrder(
        @CurrentUser('userId') userId: string,
        @Param('id') orderId: string,
        @Body() cancelOrderDto: CancelOrderDto,
    ) {
        return this.orderService.cancelOrder(userId, orderId, cancelOrderDto);
    }

    /**
     * Get all orders (Admin only)
     */
    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all orders with filters (Admin only)' })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiResponse({
        status: 200,
        description: 'Orders retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin only',
    })
    async getAllOrders(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.orderService.getAllOrders({
        status,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        startDate,
        endDate,
        });
    }

    /**
     * Update order status (Admin only)
     */
    @Patch('admin/:id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update order status (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Order status updated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid status transition',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin only',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async updateOrderStatus(
        @CurrentUser('userId') adminId: string,
        @Param('id') orderId: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
    ) {
        return this.orderService.updateOrderStatus(orderId, updateStatusDto, adminId);
    }

    /**
     * Get order statistics (Admin only)
     */
    @Get('admin/statistics')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get order statistics (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin only',
    })
    async getOrderStatistics() {
        return this.orderService.getOrderStatistics();
    }
}