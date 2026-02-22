/* eslint-disable prettier/prettier */


import { Module } from '@nestjs/common';
import { FoodCategoryService } from './services/food-category.service';
import { FoodItemService } from './services/food-item.service';
import { FoodCategoryController } from './controller/food-category.controller';
import { FoodItemController } from './controller/food-item.controller';
import { DatabaseModule } from '../database/database.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [FoodCategoryController, FoodItemController],
  providers: [FoodCategoryService, FoodItemService],
  exports: [FoodCategoryService, FoodItemService],
})
export class FoodModule {}