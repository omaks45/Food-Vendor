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
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new food category (Admin only)' })
    @ApiBody({
    schema: {
        type: 'object',
        required: ['name'],
        properties: {
        name:         { type: 'string', example: 'Rice Dishes' },
        description:  { type: 'string', example: 'All rice based meals' },
        displayOrder: { type: 'number', example: 0 },
        image: {
            type: 'string',
            format: 'binary',
            description: 'Category image (max 5MB, jpg/jpeg/png)',
        },
        },
    },
    })
    @ApiResponse({ status: 201, description: 'Category created successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
    @ApiResponse({ status: 409, description: 'Category already exists' })
    async create(
    @Body() createFoodCategoryDto: CreateFoodCategoryDto,
    @UploadedFile(
        new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
            new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false, // optional — category can exist without image
        }),
    )
    image?: Express.Multer.File,
    ) {
    return this.foodCategoryService.create(createFoodCategoryDto, image);
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
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update a food category (Admin only)' })
    @ApiBody({
    schema: {
        type: 'object',
        properties: {
        name:         { type: 'string' },
        description:  { type: 'string' },
        displayOrder: { type: 'number' },
        isActive:     { type: 'boolean' },
        image: {
            type: 'string',
            format: 'binary',
            description: 'New category image (optional)',
        },
        },
    },
    })
    async update(
    @Param('id') id: string,
    @Body() updateFoodCategoryDto: UpdateFoodCategoryDto,
    @UploadedFile(
        new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
        }),
    )
    image?: Express.Multer.File,
    ) {
    return this.foodCategoryService.update(id, updateFoodCategoryDto, image);
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