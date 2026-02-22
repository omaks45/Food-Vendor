/* eslint-disable prettier/prettier */
// src/modules/food/services/food-item.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CreateFoodItemDto } from '../dto/create-food-item.dto';
import { UpdateFoodItemDto } from '../dto/update-food-item.dto';
import { ErrorCodes } from '@/common/constants';

@Injectable()
export class FoodItemService {
    private readonly logger = new Logger(FoodItemService.name);

    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService,
    ) {}

    /**
     * Create a new food item with image upload
     * Admin only
     */
    async create(createFoodItemDto: CreateFoodItemDto, imageFile?: Express.Multer.File) {
        const {
        categoryId,
        name,
        description,
        basePrice,
        allowProteinChoice,
        allowExtraSides,
        isAvailable,
        isFeatured,
        allowCustomerMessage,
        } = createFoodItemDto;

        // Verify category exists
        const category = await this.prisma.foodCategory.findUnique({
        where: { id: categoryId },
        });

        if (!category) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Category not found',
        });
        }

        // Generate slug from name
        const slug = this.generateSlug(name);

        // Check if food item with same slug exists
        const existingItem = await this.prisma.foodItem.findUnique({
        where: { slug },
        });

        if (existingItem) {
        throw new ConflictException({
            code: ErrorCodes.RESOURCE_ALREADY_EXISTS,
            message: 'Food item with this name already exists',
        });
        }

        // Upload image to Cloudinary if provided
        let imageUrl = '';
        let imagePublicId: string | null = null;

        if (imageFile) {
        try {
            const uploadResult = await this.cloudinary.uploadImage(imageFile, 'food-items');
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
            this.logger.log(`Uploaded image for ${name}: ${imagePublicId}`);
        } catch (error) {
            this.logger.error(`Failed to upload image for ${name}:`, error.message);
            throw new BadRequestException({
            code: ErrorCodes.UPLOAD_FAILED,
            message: 'Failed to upload image',
            });
        }
        } else {
        throw new BadRequestException({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Food item image is required',
        });
        }

        const foodItem = await this.prisma.foodItem.create({
        data: {
            categoryId,
            name,
            slug,
            description,
            imageUrl,
            imagePublicId,
            basePrice,
            allowProteinChoice: allowProteinChoice ?? false,
            allowExtraSides: allowExtraSides ?? false,
            isAvailable: isAvailable ?? true,
            isFeatured: isFeatured ?? false,
            allowCustomerMessage: allowCustomerMessage ?? true,
        },
        include: {
            category: true,
        },
        });

        this.logger.log(`Created food item: ${foodItem.name} (${foodItem.id})`);

        return {
        success: true,
        message: 'Food item created successfully',
        data: foodItem,
        };
    }

    /**
     * Get all food items (public)
     * With optional filters
     */
    async findAll(params?: {
        categoryId?: string;
        available?: boolean;
        featured?: boolean;
        search?: string;
    }) {
        const { categoryId, available, featured, search } = params || {};

        const where: any = {};

        if (categoryId) {
        where.categoryId = categoryId;
        }

        if (available !== undefined) {
        where.isAvailable = available;
        }

        if (featured !== undefined) {
        where.isFeatured = featured;
        }

        if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
        }

        const foodItems = await this.prisma.foodItem.findMany({
        where,
        include: {
            category: {
            select: {
                id: true,
                name: true,
                slug: true,
            },
            },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        });

        return {
        success: true,
        message: 'Food items retrieved successfully',
        data: {
            foodItems,
            total: foodItems.length,
        },
        };
    }

    /**
     * Get food items by category (public)
     */
    async findByCategory(categoryIdOrSlug: string) {
        const category = await this.prisma.foodCategory.findFirst({
        where: {
            OR: [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }],
        },
        });

        if (!category) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Category not found',
        });
        }

        const foodItems = await this.prisma.foodItem.findMany({
        where: {
            categoryId: category.id,
            isAvailable: true,
        },
        include: {
            category: {
            select: {
                id: true,
                name: true,
                slug: true,
            },
            },
        },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        });

        return {
        success: true,
        message: 'Food items retrieved successfully',
        data: {
            category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            },
            foodItems,
            total: foodItems.length,
        },
        };
    }

    /**
     * Get a single food item by ID or slug
     */
    async findOne(identifier: string) {
        const foodItem = await this.prisma.foodItem.findFirst({
        where: {
            OR: [{ id: identifier }, { slug: identifier }],
        },
        include: {
            category: true,
        },
        });

        if (!foodItem) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Food item not found',
        });
        }

        return {
        success: true,
        message: 'Food item retrieved successfully',
        data: foodItem,
        };
    }

    /**
     * Update a food item
     * Admin only
     */
    async update(
        id: string,
        updateFoodItemDto: UpdateFoodItemDto,
        imageFile?: Express.Multer.File,
    ) {
        // Check if food item exists
        const existingItem = await this.findFoodItemByIdOrFail(id);

        const {
        categoryId,
        name,
        description,
        basePrice,
        allowProteinChoice,
        allowExtraSides,
        isAvailable,
        isFeatured,
        allowCustomerMessage,
        } = updateFoodItemDto;

        // Verify new category if provided
        if (categoryId && categoryId !== existingItem.categoryId) {
        const category = await this.prisma.foodCategory.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Category not found',
            });
        }
        }

        // Generate new slug if name is being updated
        let slug: string | undefined;
        if (name && name !== existingItem.name) {
        slug = this.generateSlug(name);

        const slugExists = await this.prisma.foodItem.findFirst({
            where: {
            AND: [{ id: { not: id } }, { slug }],
            },
        });

        if (slugExists) {
            throw new ConflictException({
            code: ErrorCodes.RESOURCE_ALREADY_EXISTS,
            message: 'Food item with this name already exists',
            });
        }
        }

        // Handle image upload if new image provided
        let imageUrl: string | undefined;
        let imagePublicId: string | null | undefined;

        if (imageFile) {
        try {
            // Delete old image from Cloudinary
            if (existingItem.imagePublicId) {
            await this.cloudinary.deleteImage(existingItem.imagePublicId);
            this.logger.log(`Deleted old image: ${existingItem.imagePublicId}`);
            }

            // Upload new image
            const uploadResult = await this.cloudinary.uploadImage(imageFile, 'food-items');
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
            this.logger.log(`Uploaded new image: ${imagePublicId}`);
        } catch (error) {
            this.logger.error(`Failed to upload image:`, error.message);
            throw new BadRequestException({
            code: ErrorCodes.UPLOAD_FAILED,
            message: 'Failed to upload image',
            });
        }
        }

        const updatedItem = await this.prisma.foodItem.update({
        where: { id },
        data: {
            categoryId,
            name,
            slug,
            description,
            imageUrl,
            imagePublicId,
            basePrice,
            allowProteinChoice,
            allowExtraSides,
            isAvailable,
            isFeatured,
            allowCustomerMessage,
        },
        include: {
            category: true,
        },
        });

        this.logger.log(`Updated food item: ${updatedItem.name} (${id})`);

        return {
        success: true,
        message: 'Food item updated successfully',
        data: updatedItem,
        };
    }

    /**
     * Delete a food item
     * Admin only
     */
    async remove(id: string) {
        const foodItem = await this.findFoodItemByIdOrFail(id);

        // Delete image from Cloudinary
        if (foodItem.imagePublicId) {
        try {
            await this.cloudinary.deleteImage(foodItem.imagePublicId);
            this.logger.log(`Deleted image: ${foodItem.imagePublicId}`);
        } catch (error) {
            this.logger.warn(`Failed to delete image from Cloudinary:`, error.message);
        }
        }

        await this.prisma.foodItem.delete({
        where: { id },
        });

        this.logger.log(`Deleted food item: ${foodItem.name} (${id})`);

        return {
        success: true,
        message: 'Food item deleted successfully',
        data: null,
        };
    }

    /**
     * Toggle food item availability
     * Admin only
     */
    async toggleAvailability(id: string) {
        const foodItem = await this.findFoodItemByIdOrFail(id);

        const updatedItem = await this.prisma.foodItem.update({
        where: { id },
        data: { isAvailable: !foodItem.isAvailable },
        });

        this.logger.log(
        `Toggled ${updatedItem.name} to ${updatedItem.isAvailable ? 'available' : 'unavailable'}`,
        );

        return {
        success: true,
        message: `Food item ${updatedItem.isAvailable ? 'marked as available' : 'marked as unavailable'}`,
        data: updatedItem,
        };
    }

    /**
     * Toggle featured status
     * Admin only
     */
    async toggleFeatured(id: string) {
        const foodItem = await this.findFoodItemByIdOrFail(id);

        const updatedItem = await this.prisma.foodItem.update({
        where: { id },
        data: { isFeatured: !foodItem.isFeatured },
        });

        this.logger.log(
        `Toggled ${updatedItem.name} featured status to ${updatedItem.isFeatured}`,
        );

        return {
        success: true,
        message: `Food item ${updatedItem.isFeatured ? 'featured' : 'unfeatured'}`,
        data: updatedItem,
        };
    }

    // ---------------------------------------------------------------------------
    // PRIVATE HELPERS
    // ---------------------------------------------------------------------------

    /**
     * Find food item by ID or throw NotFoundException
     */
    private async findFoodItemByIdOrFail(id: string) {
        const foodItem = await this.prisma.foodItem.findUnique({
        where: { id },
        });

        if (!foodItem) {
        throw new NotFoundException({
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Food item not found',
        });
        }

        return foodItem;
    }

    /**
     * Generate URL-friendly slug from food item name
     */
    private generateSlug(name: string): string {
        return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
}