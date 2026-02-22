/* eslint-disable prettier/prettier */
// src/modules/food/controllers/food-item.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FoodItemService } from '../services/food-item.service';
import { CreateFoodItemDto } from '../dto/create-food-item.dto';
import { UpdateFoodItemDto } from '../dto/update-food-item.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Food Items')
@Controller('food/items')
export class FoodItemController {
    constructor(private readonly foodItemService: FoodItemService) {}

    /**
     * Create new food item with image (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new food item with image (Admin only)' })
    @ApiBody({
        schema: {
        type: 'object',
        required: ['categoryId', 'name', 'description', 'basePrice', 'image'],
        properties: {
            categoryId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Jollof Rice Special' },
            description: {
            type: 'string',
            example: 'Delicious Nigerian Jollof rice cooked to perfection',
            },
            basePrice: { type: 'number', example: 2500 },
            allowProteinChoice: { type: 'boolean', example: true },
            allowExtraSides: { type: 'boolean', example: true },
            isAvailable: { type: 'boolean', example: true },
            isFeatured: { type: 'boolean', example: false },
            allowCustomerMessage: { type: 'boolean', example: true },
            image: {
            type: 'string',
            format: 'binary',
            description: 'Food item image (max 5MB, jpg/jpeg/png)',
            },
        },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Food item created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - validation failed or image required',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    async create(
        @Body() createFoodItemDto: CreateFoodItemDto,
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
            new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
            ],
        }),
        )
        image: Express.Multer.File,
    ) {
        return this.foodItemService.create(createFoodItemDto, image);
    }

    /**
     * Get all food items (Public)
     */
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all food items with optional filters' })
    @ApiQuery({
        name: 'categoryId',
        required: false,
        type: String,
        description: 'Filter by category ID',
    })
    @ApiQuery({
        name: 'available',
        required: false,
        type: Boolean,
        description: 'Filter by availability',
    })
    @ApiQuery({
        name: 'featured',
        required: false,
        type: Boolean,
        description: 'Filter featured items',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Search in name and description',
    })
    @ApiResponse({
        status: 200,
        description: 'Food items retrieved successfully',
    })
    async findAll(
        @Query('categoryId') categoryId?: string,
        @Query('available') available?: string,
        @Query('featured') featured?: string,
        @Query('search') search?: string,
    ) {
        const filters = {
        categoryId,
        available: available === 'true' ? true : available === 'false' ? false : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        search,
        };

        return this.foodItemService.findAll(filters);
    }

    /**
     * Get food items by category (Public)
     */
    @Public()
    @Get('category/:categoryIdOrSlug')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all food items in a category' })
    @ApiResponse({
        status: 200,
        description: 'Food items retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async findByCategory(@Param('categoryIdOrSlug') categoryIdOrSlug: string) {
        return this.foodItemService.findByCategory(categoryIdOrSlug);
    }

    /**
     * Get single food item by ID or slug (Public)
     */
    @Public()
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a food item by ID or slug' })
    @ApiResponse({
        status: 200,
        description: 'Food item retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async findOne(@Param('id') id: string) {
        return this.foodItemService.findOne(id);
    }

    /**
     * Update food item (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update a food item (Admin only)' })
    @ApiBody({
        schema: {
        type: 'object',
        properties: {
            categoryId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            basePrice: { type: 'number' },
            allowProteinChoice: { type: 'boolean' },
            allowExtraSides: { type: 'boolean' },
            isAvailable: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            allowCustomerMessage: { type: 'boolean' },
            image: {
            type: 'string',
            format: 'binary',
            description: 'New food item image (optional)',
            },
        },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Food item updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async update(
        @Param('id') id: string,
        @Body() updateFoodItemDto: UpdateFoodItemDto,
        @UploadedFile(
        new ParseFilePipe({
            validators: [
            new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
            ],
            fileIsRequired: false, // Image is optional for updates
        }),
        )
        image?: Express.Multer.File,
    ) {
        return this.foodItemService.update(id, updateFoodItemDto, image);
    }

    /**
     * Delete food item (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a food item (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Food item deleted successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async remove(@Param('id') id: string) {
        return this.foodItemService.remove(id);
    }

    /**
     * Toggle availability (Admin only)
     */
    @Patch(':id/toggle-availability')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle food item availability (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Availability toggled successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async toggleAvailability(@Param('id') id: string) {
        return this.foodItemService.toggleAvailability(id);
    }

    /**
     * Toggle featured status (Admin only)
     */
    @Patch(':id/toggle-featured')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle food item featured status (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Featured status toggled successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Food item not found',
    })
    async toggleFeatured(@Param('id') id: string) {
        return this.foodItemService.toggleFeatured(id);
    }
}