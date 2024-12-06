import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateViajeDto } from './dto/create-viaje.dto';
import { UpdateViajeDto } from './dto/update-viaje.dto';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { UsersService } from 'src/users/users.service';
import { ActivitiesService } from 'src/activities/activities.service';
import { BusesService } from 'src/buses/buses.service';
import { EstacionesService } from 'src/estaciones/estaciones.service';
import { Viaje } from './entities/viaje.entity';
import { v4 as uuid } from 'uuid';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Request } from 'express';

@Injectable()
export class ViajesService {

  constructor(
    private readonly dynamoService: DynamodbService,
    private readonly activitiesService: ActivitiesService,
    private readonly usersService: UsersService,
    private readonly busesService: BusesService,
    private readonly estacionesService: EstacionesService,
  ){}

  async create(createViajeDto: CreateViajeDto, request: Request) {
    const {nombre,userAdminId,idBus,idEstacionDestino,idEstacionOrigen} = createViajeDto;
    
    // Verificar si el usuario existe
    await this.usersService.findOneByIdAdmin(userAdminId);
    
    
    // Verificar si el bus existe
    const bus = await this.busesService.findOne(idBus);
    if (bus.estado !== true)
       throw new NotFoundException('El bus está activo.');
    
    // Verificar si las estaciones existen
    const estacionOrigen = await this.estacionesService.findOne(idEstacionOrigen);
    if (estacionOrigen.estado !== true)
        throw new NotFoundException('La estación de origen no está activa.');

    const estacionDestino = await this.estacionesService.findOne(idEstacionDestino);
    if (estacionDestino.estado !== true)
        throw new NotFoundException('La estación de destino no existe o no está activa.');
    
    //creacion del nuevo viaje
    const newViaje: Viaje = {
      primaryKey: uuid(),
      ...createViajeDto,
      nombre: createViajeDto.nombre.toUpperCase(),
      createdAt: new Date().getTime(),
      updatedAt: null,
    }

    //preparacion de la consulta
    const command = new PutCommand({
      TableName: 'viajes',
      Item: {
        ...newViaje
      }
    });
    await this.dynamoService.dynamoCliente.send(command);

    const data = {
      userAdminId, estado: false, placa: undefined, capacidad: undefined, modelo: undefined
    }
    await await this.busesService.update(idBus, data ,request)

    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);
                
    // Registra la actividad
    await this.activitiesService.create({
      userId: userAdminId,
      activityType: 'REGISTRO DE VIAJE',
      detail: `Viaje con nombre ${nombre} registrado.`,
      ip: userIp
    });

    return newViaje;
  }

  async findAll() {
    const command = new ScanCommand({
      TableName: 'viajes',
    });
    const { Items } = await this.dynamoService.dynamoCliente.send(command);

    return Items;
  }

  async findOne(id: string) {
    const command = new GetCommand({
      TableName: 'viajes',
      Key: {
        primaryKey: id,
      },
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if(!Item)
      throw new NotFoundException('Viaje no encontrado.')
    return Item;
  }

  async update(id: string, updateViajeDto: UpdateViajeDto, request: Request) {
    const {userAdminId,idBus,idEstacionDestino,idEstacionOrigen} = updateViajeDto;
    
    // Verificar si el usuario existe
    await this.usersService.findOneByIdAdmin(userAdminId);

    //verifca so existe el viaje
    const viajeDB = await this.findOne(id);

    // Verificar y actualizar el bus si cambia
    if (idBus && idBus !== viajeDB.idBus) {
        // Liberar el bus actual
        const dataBusOld = { 
          userAdminId, estado: true, placa: undefined, capacidad: undefined, modelo: undefined
         };
        await this.busesService.update(viajeDB.idBus, dataBusOld, request);

        // Actualizar el nuevo bus
        const newBusData = { 
          userAdminId, estado: false, placa: undefined, capacidad: undefined, modelo: undefined
         };
        const newBus = await this.busesService.update(idBus, newBusData, request);

        viajeDB.idBus = newBus.idBus;
    }

    // Verificar si las estaciones existen
    if(idEstacionOrigen){
      await this.estacionesService.findOne(idEstacionOrigen);
    }
    if(idEstacionDestino){
      await this.estacionesService.findOne(idEstacionDestino);
    }

    // Verificación y actualización de los campos
    if (updateViajeDto.nombre && updateViajeDto.nombre.length !== 0)  viajeDB.nombre = updateViajeDto.nombre.toUpperCase(); 
    if (updateViajeDto.descripcion && updateViajeDto.descripcion.length !== 0)  viajeDB.descripcion = updateViajeDto.descripcion;
    if (updateViajeDto.costo) viajeDB.costo = updateViajeDto.costo; 
    if (updateViajeDto.idBus)  viajeDB.idBus = updateViajeDto.idBus;
    if (updateViajeDto.idEstacionOrigen) viajeDB.idEstacionOrigen = updateViajeDto.idEstacionOrigen; 
    if (updateViajeDto.idEstacionDestino) viajeDB.idEstacionDestino = updateViajeDto.idEstacionDestino;
    if (updateViajeDto.fechaHoraSalida) viajeDB.fechaHoraSalida = updateViajeDto.fechaHoraSalida;
    if (updateViajeDto.fechaHoraLlegada) viajeDB.fechaHoraLlegada = updateViajeDto.fechaHoraLlegada;
    if (updateViajeDto.estado !== undefined) viajeDB.estado = updateViajeDto.estado;
    if (updateViajeDto.statusPromo !== undefined) viajeDB.statusPromo = updateViajeDto.statusPromo;
    if (updateViajeDto.descuentoPorcentaje !== undefined) viajeDB.descuentoPorcentaje = updateViajeDto.descuentoPorcentaje;
    viajeDB.updatedAt = new Date().getTime();
    
    const command =  new PutCommand({
      TableName: 'viajes',
      Item: {
        ...viajeDB
      }
    });
    await this.dynamoService.dynamoCliente.send(command)

    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);
                
    // Registra la actividad
    await this.activitiesService.create({
      userId: userAdminId,
      activityType: 'ACTUALIZACIÓN DE VIAJE',
      detail: `Viaje con nombre ${viajeDB.nombre} actualizado.`,
      ip: userIp,
    });
    
    return viajeDB;
  }

  async findAllTrue() {
    const command = new ScanCommand({
      TableName: 'viajes',
      FilterExpression: 'estado = :estado',
      ExpressionAttributeValues: {
        ':estado': true,
      }
    });
    const { Items } = await this.dynamoService.dynamoCliente.send(command);

    return Items;
  }

  // Función para extraer la IP del usuario
  private extractUserIp(request: Request): string {
    let userIp = Array.isArray(request.headers['x-forwarded-for'])
      ? request.headers['x-forwarded-for'][0]
      : (request.headers['x-forwarded-for'] as string) || request.ip;
    return userIp === '::1' ? '127.0.0.1' : userIp;
  }
}