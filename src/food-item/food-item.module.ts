import { Module } from '@nestjs/common';
import { FoodItemService } from './food-item.service';
import { FoodItemController } from './food-item.controller';

@Module({
  controllers: [FoodItemController],
  providers: [FoodItemService],
})
export class FoodItemModule {}
