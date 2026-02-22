/* eslint-disable prettier/prettier */
// src/modules/food/controllers/food-category.controller.ts

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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { FoodCategoryService } from '../services/food-category.service';
import { CreateFoodCategoryDto } from '../dto/create-food-category.dto';
import { UpdateFoodCategoryDto } from '../dto/update-food-category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Food Categories')
@Controller('food/categories')
export class FoodCategoryController {
    constructor(private readonly foodCategoryService: FoodCategoryService) {}

    /**
     * Create new category (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new food category (Admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 409,
        description: 'Category already exists',
    })
    async create(@Body() createFoodCategoryDto: CreateFoodCategoryDto) {
        return this.foodCategoryService.create(createFoodCategoryDto);
    }

    /**
     * Get all categories (Public)
     */
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all food categories' })
    @ApiQuery({
        name: 'activeOnly',
        required: false,
        type: Boolean,
        description: 'Filter active categories only',
    })
    @ApiResponse({
        status: 200,
        description: 'Categories retrieved successfully',
    })
    async findAll(@Query('activeOnly') activeOnly?: string) {
        const isActiveOnly = activeOnly === 'true';
        return this.foodCategoryService.findAll(isActiveOnly);
    }

    /**
     * Get single category by ID or slug (Public)
     */
    @Public()
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a food category by ID or slug' })
    @ApiResponse({
        status: 200,
        description: 'Category retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async findOne(@Param('id') id: string) {
        return this.foodCategoryService.findOne(id);
    }

    /**
     * Update category (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update a food category (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async update(
        @Param('id') id: string,
        @Body() updateFoodCategoryDto: UpdateFoodCategoryDto,
    ) {
        return this.foodCategoryService.update(id, updateFoodCategoryDto);
    }

    /**
     * Delete category (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a food category (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Category deleted successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot delete category with food items',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async remove(@Param('id') id: string) {
        return this.foodCategoryService.remove(id);
    }

    /**
     * Toggle category active status (Admin only)
     */
    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle category active status (Admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Category status toggled successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Admin access required',
    })
    @ApiResponse({
        status: 404,
        description: 'Category not found',
    })
    async toggleActive(@Param('id') id: string) {
        return this.foodCategoryService.toggleActive(id);
    }
}