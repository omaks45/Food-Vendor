import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FoodItemService } from './food-item.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { UpdateFoodItemDto } from './dto/update-food-item.dto';

@Controller('food-item')
export class FoodItemController {
  constructor(private readonly foodItemService: FoodItemService) {}

  @Post()
  create(@Body() createFoodItemDto: CreateFoodItemDto) {
    return this.foodItemService.create(createFoodItemDto);
  }

  @Get()
  findAll() {
    return this.foodItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFoodItemDto: UpdateFoodItemDto) {
    return this.foodItemService.update(+id, updateFoodItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foodItemService.remove(+id);
  }
}
