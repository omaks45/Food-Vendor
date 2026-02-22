import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from './create-food-category.dto';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
