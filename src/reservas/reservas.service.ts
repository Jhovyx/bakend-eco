import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { v4 as uuid } from 'uuid';
import { GetCommand, PutCommand , QueryCommand, ScanCommand} from '@aws-sdk/lib-dynamodb';
import { UsersService } from 'src/users/users.service';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { EstadoReserva, Reserva } from './entities/reserva.entity';
import { AsientosService } from 'src/asientos/asientos.service';

@Injectable()
export class ReservasService {

  constructor(
      private readonly dynamoService: DynamodbService,
      private readonly usersService: UsersService,
      private readonly asientosService: AsientosService,
  ){}

  async create(createReservaDto: CreateReservaDto) {
    const {idUsuario} = createReservaDto;

    //verificar si es un usuario del sistema
    const user = await this.usersService.findOne(idUsuario);
    if(!user.estado)
      throw new NotFoundException('Este usuario no esta permitivo reservar.');

    //crear el nuevo objeto
    let newReserva: Reserva = {
      primaryKey: uuid(),
      ...createReservaDto,
      createdAt: new Date().getTime(),
      updatedAt: null,
      estado: EstadoReserva.PENDIENTE,
    }

    //preparar la consulta
    const command = new PutCommand({
      TableName: 'reservas',
      Item: {
        ...newReserva
      }
    })
    await this.dynamoService.dynamoCliente.send(command);
    
    // Reservar los asientos usando un bucle for
    for (let numero = 0; numero < createReservaDto.pasajeros.length; numero++) {
      await this.asientosService.reserveAsiento(createReservaDto.pasajeros[numero].idAsiento, { reservadoPor: createReservaDto.idUsuario });
    }

    return newReserva;
  }

  async findAll() {
    const command = new ScanCommand({
      TableName: 'reservas',
    });
    const { Items } = await this.dynamoService.dynamoCliente.send(command);

    return Items;
  }

  async findOne(id: string) {
    const command = new GetCommand({
      TableName: 'reservas',
      Key: {
        primaryKey: id,
      },
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if(!Item)
      throw new NotFoundException('Reserva no encontrada.')
    return Item;
  }

  async updateconfirm(id: string, updateReservaDto: UpdateReservaDto) {

    // Verificar si la reserva existe
    const reservaBD = await this.findOne(id);
    if(reservaBD.idUsuario !== updateReservaDto.idUsuario)
    throw new NotFoundException('Este usuario no esta permitido.');

    if(reservaBD.estado !== EstadoReserva.PENDIENTE)
      throw new NotFoundException('Esta reserva no esta pendiente');

    // Crear el objeto actualizado
    reservaBD.updatedAt = new Date().getTime();
    reservaBD.estado = EstadoReserva.CONFIRMADA;

    // Sobrescribir el registro existente
    const command = new PutCommand({
      TableName: 'reservas',
      Item: {
        ...reservaBD,
      },
    });

    await this.dynamoService.dynamoCliente.send(command);
    return reservaBD;
  }

  async updatecancel(id: string, updateReservaDto: UpdateReservaDto) {

    // Verificar si la reserva existe
    const reservaBD = await this.findOne(id);
    if(reservaBD.idUsuario !== updateReservaDto.idUsuario)
    throw new NotFoundException('Este usuario no esta permitido.');

    if(reservaBD.estado !== EstadoReserva.PENDIENTE)
      throw new NotFoundException('Esta reserva no esta pendiente');

    // Crear el objeto actualizado
    reservaBD.updatedAt = new Date().getTime();
    reservaBD.estado = EstadoReserva.CANCELADA;

    // Sobrescribir el registro existente
    const command = new PutCommand({
      TableName: 'reservas',
      Item: {
        ...reservaBD,
      },
    });

    await this.dynamoService.dynamoCliente.send(command);
    return reservaBD;
  }

  async findReservasByUser(idUsuario: string) {
      // Prepara el comando QueryCommand para buscar reservas por usuario
      const queryCommand = new QueryCommand({
        TableName: 'asientos',
        IndexName: 'idUsuario-index',
        KeyConditionExpression: '#idUsuario = :idUsuario',
        ExpressionAttributeNames: {
          '#idUsuario': 'idUsuario',
        },
        ExpressionAttributeValues: {
          ':idUsuario': idUsuario,
        },
      });
    
      // Ejecuta la consulta en DynamoDB
      const { Items }= await this.dynamoService.dynamoCliente.send(queryCommand);
  
      // Retorna los asientos encontrados
      return Items;
    }

}