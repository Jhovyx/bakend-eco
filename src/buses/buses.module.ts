import { Module } from '@nestjs/common';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UsersModule } from 'src/users/users.module';
import { AsientosModule } from 'src/asientos/asientos.module';

@Module({
  controllers: [BusesController],
  providers: [BusesService],
  imports: [DynamodbModule,ActivitiesModule,UsersModule,AsientosModule],
  exports: [BusesService]
})
export class BusesModule {}
