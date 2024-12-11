import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { UsersService } from 'src/users/users.service';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { Asiento, EstadoAsiento } from './entities/asiento.entity';
import { v4 as uuid } from 'uuid';
import { GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AsientosGateway } from './asientos.gateway';


@Injectable()
export class AsientosService implements OnModuleInit {

  private interval: NodeJS.Timeout;

  constructor(
    private readonly dynamoService: DynamodbService,
    private readonly usersService: UsersService,
    private readonly asientosGateway: AsientosGateway
  ){}

  //para liberar asientos falta
  onModuleInit() {
  }

  async create(createAsientoDto: CreateAsientoDto) {
    const {userAdminId,idBus,numero} = createAsientoDto;

    //verificar si es un administrador
    await this.usersService.findOneByIdAdmin(userAdminId);

    //crear el nuevo objeto
    const newAsiento: Asiento = {
      primaryKey: uuid(),
      ...createAsientoDto,
      createdAt: new Date().getTime(),
      updatedAt: null,
      estado: EstadoAsiento.DISPONIBLE,
    }

    //preparar la consulta
    const command = new PutCommand({
      TableName: 'asientos',
      Item: {
        ...newAsiento
      }
    })
    await this.dynamoService.dynamoCliente.send(command);
    return newAsiento
  }

  async findAll() {
    const command = new ScanCommand({
      TableName: 'asientos',
    });
    const { Items } = await this.dynamoService.dynamoCliente.send(command);
    return Items;
  }

  async findOne(id: string) {
    const command = new GetCommand({
      TableName: 'asientos',
      Key: {
        primaryKey: id,
      },
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if(!Item)
      throw new NotFoundException('Asiento no encontrado.')
    return Item as Asiento;
  }

  
  async update(id: string, updateAsientoDto: UpdateAsientoDto) {
    const {estado,reservadoPor} = updateAsientoDto;

    //verificar si existe ese asiento
    const asientoBD = await this.findOne(id);
    const user = await this.usersService.findOne(reservadoPor);
    if(user.estado !== true)
      throw new NotFoundException(`El usuario no puede realizar esta acción".`);

    if (estado && asientoBD.estado === estado)
      throw new NotFoundException(`El asiento ya está en el estado "${estado}".`);
    
    if (reservadoPor && asientoBD.reservadoPor === reservadoPor)
      throw new NotFoundException(`El asiento ya está reservado por el usuario "${reservadoPor}".`);

    //actualizacion de campos
    asientoBD.updatedAt = new Date().getTime();
    asientoBD.timestampSeleccion = new Date().getTime();
    if(estado) asientoBD.estado = estado;
    if (estado) asientoBD.estado = estado;
    if (reservadoPor) asientoBD.reservadoPor = reservadoPor;

    //preparacion de la consulta
    const comand = new  PutCommand({
      TableName: 'asientos',
      Item: {
        ...asientoBD
      }
    });         
    await this.dynamoService.dynamoCliente.send(comand)
    this.asientosGateway.emitAsientoActualizado(asientoBD);
    return asientoBD
  }

  async findAsientosByBus(idBus: string) {
    // Prepara el comando QueryCommand para buscar asientos por el idBus
    const queryCommand = new QueryCommand({
      TableName: 'asientos',
      IndexName: 'idBus-index',
      KeyConditionExpression: '#idBus = :idBus',
      ExpressionAttributeNames: {
        '#idBus': 'idBus',
      },
      ExpressionAttributeValues: {
        ':idBus': idBus,
      },
    });
  
    // Ejecuta la consulta en DynamoDB
    const { Items } = await this.dynamoService.dynamoCliente.send(queryCommand);
  
    // Retorna los asientos encontrados
    return Items;
  }
}
