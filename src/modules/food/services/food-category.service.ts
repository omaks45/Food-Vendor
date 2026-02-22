/* eslint-disable prettier/prettier */
// src/modules/food/services/food-category.service.ts

import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CreateFoodCategoryDto } from '../dto/create-food-category.dto';
import { UpdateFoodCategoryDto } from '../dto/update-food-category.dto';
import { ErrorCodes } from '@/common/constants';

@Injectable()
export class FoodCategoryService {
    private readonly logger = new Logger(FoodCategoryService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Create a new food category
     * Admin only
     */
    async create(createFoodCategoryDto: CreateFoodCategoryDto) {
        const { name, description, imageUrl, displayOrder } = createFoodCategoryDto;

        // Generate slug from name
        const slug = this.generateSlug(name);

        // Check if category with same name or slug exists
        const existingCategory = await this.prisma.foodCategory.findFirst({
        where: {
            OR: [{ name }, { slug }],
        },
        });

        if (existingCategory) {
        throw new ConflictException({
            code: ErrorCodes.RESOURCE_ALREADY_EXISTS,
            message: 'Category with this name already exists',
        });
        }

        const category = await this.prisma.foodCategory.create({
        data: {
            name,
            slug,
            description,
            imageUrl,
            displayOrder: displayOrder ?? 0,
        },
        });

        this.logger.log(`Created food category: ${category.name} (${category.id})`);

        return {
        success: true,
        message: 'Food category created successfully',
        data: category,
        };
    }

    /**
     * Get all food categories (public)
     * Optionally filter by active status
     */
    async findAll(activeOnly: boolean = false) {
        const where = activeOnly ? { isActive: true } : {};

        const categories = await this.prisma.foodCategory.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
            _count: {
            select: { foodItems: true },
            },
        },
        });

        return {
        success: true,
        message: 'Categories retrieved successfully',
        data: {
            categories,
            total: categories.length,
        },
        };
    }

    /**
     * Get a single food category by ID or slug
     */
    async findOne(identifier: string) {
        const category = await this.prisma.foodCategory.findFirst({
        where: {
            OR: [{ id: identifier }, { slug: identifier }],
        },
        include: {
            foodItems: {
            where: { isAvailable: true },
            orderBy: { name: 'asc' },
            },
            _count: {
            select: { foodItems: true },
            },
        },
        });

        if (!category) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Category not found',
        });
        }

        return {
        success: true,
        message: 'Category retrieved successfully',
        data: category,
        };
    }

    /**
     * Update a food category
     * Admin only
     */
    async update(id: string, updateFoodCategoryDto: UpdateFoodCategoryDto) {
        // Check if category exists
        await this.findCategoryByIdOrFail(id);

        const { name, description, imageUrl, isActive, displayOrder } = updateFoodCategoryDto;

        // If name is being updated, generate new slug and check for conflicts
        let slug: string | undefined;
        if (name) {
        slug = this.generateSlug(name);

        const existingCategory = await this.prisma.foodCategory.findFirst({
            where: {
            AND: [
                { id: { not: id } },
                { OR: [{ name }, { slug }] },
            ],
            },
        });

        if (existingCategory) {
            throw new ConflictException({
            code: ErrorCodes.RESOURCE_ALREADY_EXISTS,
            message: 'Category with this name already exists',
            });
        }
        }

        const updatedCategory = await this.prisma.foodCategory.update({
        where: { id },
        data: {
            name,
            slug,
            description,
            imageUrl,
            isActive,
            displayOrder,
        },
        });

        this.logger.log(`Updated food category: ${updatedCategory.name} (${id})`);

        return {
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
        };
    }

    /**
     * Delete a food category
     * Admin only
     */
    async remove(id: string) {
        // Check if category exists
        const category = await this.findCategoryByIdOrFail(id);

        // Check if category has food items
        const itemCount = await this.prisma.foodItem.count({
        where: { categoryId: id },
        });

        if (itemCount > 0) {
        throw new BadRequestException({
            code: ErrorCodes.CANNOT_DELETE_RESOURCE,
            message: `Cannot delete category with ${itemCount} food items. Please delete or reassign the items first.`,
        });
        }

        await this.prisma.foodCategory.delete({
        where: { id },
        });

        this.logger.log(`Deleted food category: ${category.name} (${id})`);

        return {
        success: true,
        message: 'Category deleted successfully',
        data: null,
        };
    }

    /**
     * Toggle category active status
     * Admin only
     */
    async toggleActive(id: string) {
        const category = await this.findCategoryByIdOrFail(id);

        const updatedCategory = await this.prisma.foodCategory.update({
        where: { id },
        data: { isActive: !category.isActive },
        });

        this.logger.log(
        `Toggled category ${updatedCategory.name} to ${updatedCategory.isActive ? 'active' : 'inactive'}`,
        );

        return {
        success: true,
        message: `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedCategory,
        };
    }

    // ---------------------------------------------------------------------------
    // PRIVATE HELPERS
    // ---------------------------------------------------------------------------

    /**
     * Find category by ID or throw NotFoundException
     */
    private async findCategoryByIdOrFail(id: string) {
        const category = await this.prisma.foodCategory.findUnique({
        where: { id },
        });

        if (!category) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Category not found',
        });
        }

        return category;
    }

    /**
     * Generate URL-friendly slug from category name
     */
    private generateSlug(name: string): string {
        return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    }
}