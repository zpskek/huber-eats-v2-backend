import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {
  @Field((type) => Number)
  userId: number;
}

@ObjectType()
export class EditProfileOutput extends CoreOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
