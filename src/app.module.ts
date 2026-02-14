import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './users/auth/auth.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { FoodItemModule } from './food-item/food-item.module';
import { OrderModule } from './order/order.module';
import { RatingModule } from './rating/rating.module';

@Module({
  imports: [AuthModule, UsersModule, CartModule, FoodItemModule, OrderModule, RatingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
