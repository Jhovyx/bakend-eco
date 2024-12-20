import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSesioneDto } from './dto/create-sesione.dto';
import { UpdateSesioneDto } from './dto/update-sesione.dto';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { Sesion } from './entities/sesione.entity';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { JwtPayload } from './entities/payload.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SesionesService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly dynamoService: DynamodbService,
  ){}

  //crear el token y crear la sesion y retornar el token 
  async create(createSesioneDto: CreateSesioneDto) {
    try {
      //verificar si tiene su cuenta inactiva y si es asi activarlo y generarle su token y sino tiene una cuenta activa crearle otra sesion
      const SesionDB = await this.findOne(createSesioneDto.userId);
      if(SesionDB === 'x'){//crear sesion
        const refreshToken = uuid();
        const primaryKey = uuid();
        //crear el token
        const token = await this.jwtService.signAsync({...createSesioneDto,refreshToken,primaryKey});
        const newSesion: Sesion = {
          primaryKey,
          ...createSesioneDto,
          token,
          estado: true,
          refreshToken,
          createdAt: new Date().getTime(),
          updatedAt: null,
        }
        //preparacion de la consulta 
        const command = new PutCommand({
          TableName: 'sesiones',
          Item: {
            ...newSesion
          }
        });
        await this.dynamoService.dynamoCliente.send(command)
        return token
      }else{
        //actulizar solo una sesion enviar su token y su refresh si hay 
        const refreshToken = uuid();
        const primaryKey = SesionDB.primaryKey.S;
        
        const token = await this.jwtService.signAsync({...createSesioneDto,refreshToken,primaryKey});
        const updateCommand = new UpdateItemCommand({
          TableName: 'sesiones',
          Key: {
            primaryKey: { S: SesionDB.primaryKey.S },
          },
          UpdateExpression: 'SET #tk = :token, estado = :estado, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#tk': 'token',  // Alias para 'token'
          },
          ExpressionAttributeValues: {
            ':token': { S: token },
            ':estado': { BOOL: true },
            ':updatedAt': { N: new Date().getTime().toString() },
          },
        });
        await this.dynamoService.dynamoCliente.send(updateCommand);
        return token
      }
    } catch (error) {
      throw new NotFoundException('Ocurrio un error inesperado.');
    }
  }

  async refrechToken(payload: JwtPayload, user: User) {
    const {exp,iat, ...res} = payload;
    const token = await this.jwtService.signAsync(res);
    const updateCommand = new UpdateItemCommand({
      TableName: 'sesiones',
      Key: {
        primaryKey: { S: payload.primaryKey },
      },
      UpdateExpression: 'SET #tk = :token, estado = :estado, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#tk': 'token',  // Alias para 'token'
      },
      ExpressionAttributeValues: {
        ':token': { S: token },
        ':estado': { BOOL: true },
        ':updatedAt': { N: new Date().getTime().toString() },
      },
    });
    await this.dynamoService.dynamoCliente.send(updateCommand);
    return token
  }

  private async findOne(userId: string) {
    const command = new QueryCommand({
      TableName: 'sesiones',
      IndexName: 'userId-index',//GSI
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
    });
    const {Items} = await this.dynamoService.dynamoCliente.send(command);
    
    // Si no se encuentra la sesion
    if (!Items || Items.length === 0)return "x";

    // Buscar una sesión inactiva
    const inactiveSesion = Items.find(item => item.estado.BOOL === false);

    if (inactiveSesion) return inactiveSesion;

    // Si todas están activas, retornar 'x'
    return 'x';
  }

  //cerrar sesion
  async deactivateSession(access_token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(access_token,{secret: process.env.JWT_SECRET})
      const updateCommand = new UpdateItemCommand({
        TableName: 'sesiones',
        Key: {
          primaryKey: { S: payload.primaryKey },
        },
        UpdateExpression: 'SET estado = :estado, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':estado': { BOOL: false },  // Actualizamos la sesion
          ':updatedAt': { N: new Date().getTime().toString() },
        },
      });
      await this.dynamoService.dynamoCliente.send(updateCommand);
      return 'La sesión ha sido cerrada.';
    } catch (error) {
      throw new NotFoundException('Error al desactivar la cuenta.');
    }
  }

  async verifyAllToken(tokenCookie: string) {
    return await this.jwtService.verifyAsync(tokenCookie, {
      secret: process.env.JWT_SECRET,
      ignoreExpiration: true, // Ignorar la expiración del token
    });
  }  

  //verificar si la sesion esta activa 
  async verifySesion(primaryKey: string) {
    const command = new GetCommand({
      TableName: 'sesiones',
      Key: {
        primaryKey:  primaryKey ,
      },
      ProjectionExpression: 'estado',
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if (!Item)
      throw new NotFoundException('Sesion no encontrada.');
    if(Item.estado !== true)
      throw new NotFoundException('Sesion inactiva.')
    return Item.estado;
  }
    
}
