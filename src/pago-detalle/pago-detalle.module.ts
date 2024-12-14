import { Module } from '@nestjs/common';
import { PagoDetalleService } from './pago-detalle.service';
import { PagoDetalleController } from './pago-detalle.controller';

@Module({
  controllers: [PagoDetalleController],
  providers: [PagoDetalleService],
})
export class PagoDetalleModule {}
