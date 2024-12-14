import { Injectable } from '@nestjs/common';
import { CreatePagoDetalleDto } from './dto/create-pago-detalle.dto';
import { UpdatePagoDetalleDto } from './dto/update-pago-detalle.dto';
import { PagoDetalle } from './entities/pago-detalle.entity';

@Injectable()
export class PagoDetalleService {
  private pagoDetalles: PagoDetalle[] = [];

  create(createPagoDetalleDto: CreatePagoDetalleDto): PagoDetalle {
    const newPagoDetalle = { id: Date.now(), ...createPagoDetalleDto };
    this.pagoDetalles.push(newPagoDetalle);
    return newPagoDetalle;
  }

  findAll(): PagoDetalle[] {
    return this.pagoDetalles;
  }

  findOne(id: number): PagoDetalle {
    return this.pagoDetalles.find(pagoDetalle => pagoDetalle.id === id);
  }

  update(id: number, updatePagoDetalleDto: UpdatePagoDetalleDto): PagoDetalle {
    const index = this.pagoDetalles.findIndex(pagoDetalle => pagoDetalle.id === id);
    this.pagoDetalles[index] = { ...this.pagoDetalles[index], ...updatePagoDetalleDto };
    return this.pagoDetalles[index];
  }

  remove(id: number): void {
    this.pagoDetalles = this.pagoDetalles.filter(pagoDetalle => pagoDetalle.id !== id);
  }
}
