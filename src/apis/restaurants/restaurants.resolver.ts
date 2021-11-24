import {
  Resolver,
  Mutation,
  Args,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';

import { AuthUser } from '@auth/auth-user.decorator';
import { Roles } from '@auth/role.decorator';
import { User } from '@apis/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from '@apis/restaurants/dtos/create-restaurant.dto';
import {
  GetRestaurantsInput,
  GetRestaurantsOutput,
} from '@src/apis/restaurants/dtos/get-restaurants.dto';
import { Restaurant } from '@apis/restaurants/entities/restaurant.entity';
import { RestaurantService } from '@apis/restaurants/restaurants.service';
import {
  FindRestaurantByIdInput,
  FindRestaurantByIdOutput,
} from '@apis/restaurants/dtos/find-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from '@apis/restaurants/dtos/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from '@apis/restaurants/dtos/delete-restaurant.dto';
import { DishService } from '../dishes/dish.service';

@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly dishService: DishService,
  ) {}

  @ResolveField()
  async dishes(@Parent() restaurant: Restaurant) {
    const { id } = restaurant;
    const dishes = await this.dishService.getDishesByWhere({
      where: {
        restaurant: {
          id,
        },
      },
    });
    return dishes;
  }

  @Mutation((returns) => CreateRestaurantOutput)
  @Roles(['Owner'])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Query((returns) => GetRestaurantsOutput)
  @Roles(['Owner'])
  async getMyRestaurants(
    @AuthUser() owner: User,
    @Args('input') getRestaurantsInput: GetRestaurantsInput,
  ): Promise<GetRestaurantsOutput> {
    return this.restaurantService.getRestaurants(getRestaurantsInput, owner);
  }

  @Query((returns) => GetRestaurantsOutput)
  async getRestaurants(
    @Args('input') getRestaurantsInput: GetRestaurantsInput,
  ): Promise<GetRestaurantsOutput> {
    return this.restaurantService.getRestaurants(getRestaurantsInput);
  }

  @Query((returns) => FindRestaurantByIdOutput)
  async findRestaurantById(
    @Args('input') findRestaurantInput: FindRestaurantByIdInput,
  ): Promise<FindRestaurantByIdOutput> {
    return this.restaurantService.findRestaurantById(findRestaurantInput);
  }

  @Mutation((returns) => EditRestaurantOutput)
  @Roles(['Owner'])
  async editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation((returns) => DeleteRestaurantOutput)
  @Roles(['Owner'])
  async deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }
}
