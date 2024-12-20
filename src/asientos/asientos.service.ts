import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UsersService } from 'src/users/users.service';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { Asiento, EstadoAsiento } from './entities/asiento.entity';
import { v4 as uuid } from 'uuid';
import { GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AsientosGateway } from './asientos.gateway';
import { UpdateAsientoDto } from './dto/update-asiento.dto';


@Injectable()
export class AsientosService implements OnModuleInit {

  private interval: NodeJS.Timeout;

  constructor(
    private readonly dynamoService: DynamodbService,
    private readonly usersService: UsersService,
    private readonly asientosGateway: AsientosGateway
  ){}

  //para liberar asientos
  onModuleInit() {
    this.interval = setInterval(async () => {
      const now = new Date().getTime();
  
      // Consultar solo los asientos con estado SELECCIONADO
      const queryCommand = new QueryCommand({
        TableName: 'asientos',
        IndexName: 'estado-index', // Nombre del índice creado
        KeyConditionExpression: '#estado = :estado',
        ExpressionAttributeNames: {
          '#estado': 'estado',        },
        ExpressionAttributeValues: {
          ':estado': EstadoAsiento.SELECCIONADO,        },
      });
  
      const { Items } = await this.dynamoService.dynamoCliente.send(queryCommand);
      if(Items && Items.length !== 0){
        for (const item  of Items) {
          const asiento: Asiento = item as Asiento;
  
          // Actualizar el estado del asiento a DISPONIBLE
          asiento.estado = EstadoAsiento.DISPONIBLE;
          asiento.reservadoPor = null;
	  asiento.timestampSeleccion = null;
          asiento.updatedAt = new Date().getTime();
    
          const updateCommand = new PutCommand({
            TableName: 'asientos',
            Item: { ...asiento },
          });
    
          await this.dynamoService.dynamoCliente.send(updateCommand);
          this.asientosGateway.emitAsientoActualizado(asiento);
        }
      }
    }, 10 * 60 * 1000); //revisa cada 5 minutos y si pasa mas de 5minitos uno lo libera 
  }

  async create(createAsientoDto: CreateAsientoDto) {
    const {userAdminId} = createAsientoDto;

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
    const { Items }= await this.dynamoService.dynamoCliente.send(queryCommand);

    // Retorna los asientos encontrados
    return Items;
  }

  async selectAsiento(id: string, updateAsientoDto: UpdateAsientoDto) {
    const asiento = await this.findOne(id);

    if (asiento.estado !== EstadoAsiento.DISPONIBLE)
      throw new NotFoundException('El asiento no está disponible para seleccionar.');

    asiento.estado = EstadoAsiento.SELECCIONADO;
    asiento.reservadoPor = updateAsientoDto.reservadoPor;
    asiento.timestampSeleccion = new Date().getTime();
    asiento.updatedAt = new Date().getTime();

    const command = new PutCommand({
      TableName: 'asientos',
      Item: { ...asiento },
    });
    await this.dynamoService.dynamoCliente.send(command);

    this.asientosGateway.emitAsientoActualizado(asiento);
    return asiento;
  }

async deseleccionarAsiento(id: string, updateAsientoDto: UpdateAsientoDto) {
  const asiento = await this.findOne(id);

  if (asiento.estado !== EstadoAsiento.SELECCIONADO)
    throw new NotFoundException('El asiento no está seleccionado para deseleccionar.');

if (asiento.reservadoPor !== updateAsientoDto.reservadoPor)
throw new NotFoundException('Solo la persona que seleccionó el asiento puede deseleccionarlo.');

  asiento.estado = EstadoAsiento.DISPONIBLE;
  asiento.reservadoPor = null;  // El campo reservadoPor se borra al deseleccionar
  asiento.timestampSeleccion = null;  // Se limpia el timestamp
  asiento.updatedAt = new Date().getTime();

  const command = new PutCommand({
    TableName: 'asientos',
    Item: { ...asiento },
  });
  await this.dynamoService.dynamoCliente.send(command);

  this.asientosGateway.emitAsientoActualizado(asiento);

  return asiento;
}


  async reserveAsiento(id: string, updateAsientoDto: UpdateAsientoDto) {
    const asiento = await this.findOne(id);

    if (asiento.estado !== EstadoAsiento.SELECCIONADO || asiento.reservadoPor !== updateAsientoDto.reservadoPor)
      throw new NotFoundException('El asiento no está seleccionado por este usuario o ya está reservado.');

    asiento.estado = EstadoAsiento.RESERVADO;
    asiento.updatedAt = new Date().getTime();

    const command = new PutCommand({
      TableName: 'asientos',
      Item: { ...asiento },
    });
    await this.dynamoService.dynamoCliente.send(command);

    this.asientosGateway.emitAsientoActualizado(asiento);
    return asiento;
  }
}
