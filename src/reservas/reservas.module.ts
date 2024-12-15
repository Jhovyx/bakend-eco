import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';
import { UsersModule } from 'src/users/users.module';
import { AsientosModule } from 'src/asientos/asientos.module';

@Module({
  controllers: [ReservasController],
  providers: [ReservasService],
  imports: [DynamodbModule, UsersModule, AsientosModule],
  exports: [ReservasService],
})
export class ReservasModule {}
