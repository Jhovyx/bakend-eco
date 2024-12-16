import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { ReservasService } from 'src/reservas/reservas.service';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { Pago } from './entities/pago.entity';
import { v4 as uuid } from 'uuid';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { EstadoReserva } from 'src/reservas/entities/reserva.entity';

@Injectable()
export class PagosService {

  constructor(
    private reservaService: ReservasService,
    private dynamoService: DynamodbService
  ){}

  async create(createPagoDto: CreatePagoDto) {

// Verificar si la reserva existe y obtener sus detalles
  const reserva = await this.reservaService.findOne(createPagoDto.idReserva);

  // Validar que la reserva está en estado PENDIENTE
  if (reserva.estado !== EstadoReserva.PENDIENTE)
    throw new NotFoundException('No se puede procesar el pago.');    

    let newpago: Pago = {
      ...createPagoDto,
      primaryKey: uuid(),
      createdAt: new Date().getTime(),
    }

    //preparar la consulta
    const command = new PutCommand({
      TableName: 'pagos',
      Item: {
        ...newpago
      }
    })
    await this.dynamoService.dynamoCliente.send(command);
    await this.reservaService.updateconfirm(createPagoDto.idReserva,{estado: EstadoReserva.CONFIRMADA, idUsuario: createPagoDto.idUsuario})
    return newpago
  }

  async findAll() {
    const command = new ScanCommand({
          TableName: 'pagos',
    });
    const { Items } = await this.dynamoService.dynamoCliente.send(command);
    
    return Items;
  }

  async findOne(id: string) {
    const command = new GetCommand({
          TableName: 'pagos',
          Key: {
            primaryKey: id,
          },
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if(!Item)
      throw new NotFoundException('Reserva no encontrada.')
    return Item;
  }

  update(id: string, updatePagoDto: UpdatePagoDto) {
    return `This action updates a #${id} pago`;
  }

}
