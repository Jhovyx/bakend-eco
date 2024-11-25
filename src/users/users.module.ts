import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { SesionesModule } from 'src/sesiones/sesiones.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    DynamodbModule,
    ActivitiesModule,
    SesionesModule
  ],
  exports: [UsersService]
})
export class UsersModule {}
