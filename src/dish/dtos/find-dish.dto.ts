import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class FindDishInput extends PickType(Dish, ['id']) {
  @Field((type) => Int)
  restaurantId: number;
}

@ObjectType()
export class FindDishOutput extends CoreOutput {
  @Field((type) => Dish)
  dish?: Dish;
}
