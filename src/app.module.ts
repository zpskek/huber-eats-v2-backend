import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import Joi from 'joi';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
    ignoreEnvFile: process.env.NODE_ENV === 'production',
    validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('dev', 'production', 'test').required()
    })
  }),
  GraphQLModule.forRoot({
    autoSchemaFile: true
  })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
