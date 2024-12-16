import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';
import { ReservasModule } from 'src/reservas/reservas.module';

@Module({
  controllers: [PagosController],
  providers: [PagosService],
  imports: [DynamodbModule, ReservasModule],
  exports: [PagosService]
})
export class PagosModule {}
