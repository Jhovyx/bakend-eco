import { Module } from '@nestjs/common';
import { AsientosService } from './asientos.service';
import { AsientosController } from './asientos.controller';
import { UsersModule } from 'src/users/users.module';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';
import { AsientosGateway } from './asientos.gateway';

@Module({
  controllers: [AsientosController],
  providers: [AsientosService, AsientosGateway],
  imports: [DynamodbModule,UsersModule],
  exports: [AsientosService]
})
export class AsientosModule {}
