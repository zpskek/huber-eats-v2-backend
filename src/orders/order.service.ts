import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/dishes/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { FindOrderInput, FindOrderOutput } from './dtos/find-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import {
  UpdateOrderStatusInput,
  UpdateOrderStatusOutput,
} from './dtos/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found.',
          };
        }
        let dishFinalPrice = dish.price;
        if (item.options) {
          for (const itemOption of item.options) {
            const dishOption = dish.options.find(
              (dishOption) => dishOption.name === itemOption.name,
            );

            if (dishOption) {
              if (dishOption.extra) {
                dishFinalPrice += dishOption.extra;
              } else {
                const dishOptionChoice = dishOption.choices.find(
                  (dishOptionChoice) =>
                    dishOptionChoice.name === itemOption.choice,
                );

                if (dishOptionChoice) {
                  if (dishOptionChoice.extra) {
                    dishFinalPrice += dishOptionChoice.extra;
                  }
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;

        const orderItem = await this.orderItems.save(
          await this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        await this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      return {
        ok: true,
        orderId: order.id,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not create order',
      };
    }
  }

  async getOrders(
    user: User,
    { restaurantId, status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];

      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
          relations: ['items', 'items.dish'],
        });
      } else if (user.role === UserRole.Owner) {
        const restaurant = await this.restaurants.findOne({
          where: {
            owner: user,
            id: restaurantId,
          },
          relations: ['orders'],
        });

        if (!restaurant) {
          return {
            ok: false,
            error: 'Restaurant not found',
          };
        }

        orders = await this.orders.find({
          where: {
            restaurant,
          },
          order: {
            id: 'ASC',
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            deliver: user,
            ...(status && { status }),
          },
        });
      }

      if (status) {
        orders = orders.filter((order) => order.status === status);
      }

      return {
        ok: true,
        orders,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not get orders',
      };
    }
  }

  canSeeOrder(user: User, order: Order) {
    let canSee = true;
    if (user.role === UserRole.Client && user.id !== order.customerId) {
      canSee = false;
    } else if (
      user.role === UserRole.Owner &&
      user.id !== order.restaurant.ownerId
    ) {
      canSee = false;
    } else if (user.role === UserRole.Delivery && user.id !== order.deliverId) {
      canSee = false;
    }

    return canSee;
  }

  async findOrder(
    user: User,
    { orderId }: FindOrderInput,
  ): Promise<FindOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant', 'items', 'items.dish'],
      });

      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: 'You can not see that.',
        };
      }

      return {
        ok: true,
        order,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not get orders',
      };
    }
  }

  async updateOrderStatus(
    user: User,
    { orderId, status }: UpdateOrderStatusInput,
  ): Promise<UpdateOrderStatusOutput> {
    try {
      const order = await this.orders.findOne(orderId);

      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }

      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      } else if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      } else if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }

      await this.orders.save({
        id: orderId,
        status,
      });

      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not update order',
      };
    }
  }
}
