import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DynamodbService } from 'src/dynamodb/dynamodb.service';
import { QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { GetCommand, PutCommand, ScanCommand, } from '@aws-sdk/lib-dynamodb';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { LoginDTO } from './dto/login-users.dto';
import { ActivitiesService } from 'src/activities/activities.service';
import { Request, Response as ExpressResponse } from 'express';
import axios from 'axios';
import { SesionesService } from 'src/sesiones/sesiones.service';
@Injectable()
export class UsersService {
  //create, findAll, findOne, update-user, update-password and login
  constructor(
    private readonly dynamoService: DynamodbService,
    private readonly activitiesService: ActivitiesService,
    private readonly sesionService: SesionesService,
  ){}

  //CREAR
  async create(createUserDto: CreateUserDto, request: Request) {
    
    // Verifica si el usuario ya existe por correo electrónico
    const userExist = await this.findOneByEmail(createUserDto.email)
    if(userExist !== "x")
      throw new NotFoundException("Este usuario ya tiene una cuenta.");

    const {userAdminId,firstName,lastName,password, ...user} = createUserDto;

    // Verifica si hay un ID de usuario administrador y, si existe, valida que sea válido
    if(createUserDto.userAdminId) await this.findOneByIdAdmin(createUserDto.userAdminId);

    // Encripta la contraseña
    const passwordEncripted = await bcrypt.hash(password, 10);

    // Define el tipo de usuario
    const userType = userAdminId ? 'admin' : 'cliente';

    // Crea el nuevo usuario
    const newUser: User = {
      primaryKey: uuid(),
      createdAt: new Date().getTime(),
      ...user,
      firstName: firstName.toUpperCase(),
      lastName: lastName.toUpperCase(),
      password: passwordEncripted,
      estado: true,
      userType,
      updatedAt: null,
    };

    //preparacion de la consulta
    const command = new PutCommand({
      TableName: 'users',
      Item: {
        ...newUser
      }
    })
    await this.dynamoService.dynamoCliente.send(command);

    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);
    
    // Registra la actividad
    await this.activitiesService.create({
      userId: newUser.primaryKey,
      activityType: 'CREACIÓN DE USUARIO',
      detail: userAdminId
        ? `Usuario administrador creado por ${userAdminId}.`
        : `Usuario cliente creado.`,
      ip: userIp,
    });

    //retorna el mensaje
    return { message: 'Usuario creado con éxito.' };
  }

  //OBTENER TODOS
  async findAll() {
    const command = new ScanCommand({
      TableName: 'users',
      ProjectionExpression: 'primaryKey, firstName, lastName, documentType, documentNumber, phoneNumber, email, profilePictureUrl, userType, createdAt, updatedAt, estado',
    });
    const {Items} = await this.dynamoService.dynamoCliente.send(command);
   
    return Items;
  }

  //OBTENER POR ID
  async findOne(id: string) {
    const command = new GetCommand({
      TableName: 'users',
      Key: {
        primaryKey:  id ,
      },
      ProjectionExpression: 'primaryKey, firstName, lastName, documentType, documentNumber, phoneNumber, email, profilePictureUrl, userType, createdAt, updatedAt, estado',
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    if (!Item)
      throw new NotFoundException('Usuario no encontrado.');
    return Item;
  }

  //ACTUALIZAR
  async update(id: string, updateUserDto: UpdateUserDto, request: Request, res: ExpressResponse) {

    //Verificar que el usuario exista
    const userBD = await this.findOne(id);
    if (updateUserDto.estado !== undefined) {
      if(updateUserDto.userAdminId && updateUserDto.userAdminId.length !== 0){
        await this.findOneByIdAdmin(updateUserDto.userAdminId);
        userBD.estado = updateUserDto.estado;
      }else{
        throw new NotFoundException("Este usuario no esta permitido que realize esta acción.");
      }
    } 

    userBD.updatedAt = new Date().getTime();

    // Solo se actualizan los campos que se pasan en el DTO
    if(updateUserDto.email && updateUserDto.email.length !== 0){
      // Verifica que el email no esté en uso por otro usuario
      const userId = await this.findOneByEmail(updateUserDto.email);
      if(userId !== "x"){
        throw new NotFoundException('El correo electrónico ya está en uso por otro usuario.');
      }
      userBD.email = updateUserDto.email;
    }
      // Actualizar los otros campos
    if (updateUserDto.documentType && updateUserDto.documentType.length !== 0) userBD.documentType = updateUserDto.documentType;
    if (updateUserDto.documentNumber && updateUserDto.documentNumber.length !== 0) userBD.documentNumber = updateUserDto.documentNumber;
    if (updateUserDto.firstName && updateUserDto.firstName.length !== 0) userBD.firstName = updateUserDto.firstName.toUpperCase();
    if (updateUserDto.lastName && updateUserDto.lastName.length !== 0) userBD.lastName = updateUserDto.lastName.toUpperCase();
    if (updateUserDto.phoneNumber && updateUserDto.phoneNumber.length !== 0) userBD.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.profilePictureUrl && updateUserDto.profilePictureUrl.length !== 0) userBD.profilePictureUrl = updateUserDto.profilePictureUrl;

    //preparacion de la consulta
    const updateCommand = new UpdateItemCommand({
      TableName: 'users',
      Key: { 
        primaryKey: { S: userBD.primaryKey },
      },
      UpdateExpression: 'set email = :email, documentType = :documentType, documentNumber = :documentNumber, updatedAt = :updatedAt, firstName = :firstName, lastName = :lastName, phoneNumber = :phoneNumber, profilePictureUrl = :profilePictureUrl, estado = :estado',
      ExpressionAttributeValues: {
        ':email': { S: userBD.email },
        ':documentType': { S: userBD.documentType },
        ':documentNumber': { S: userBD.documentNumber },
        ':updatedAt': { N: new Date().getTime().toString() },
        ':firstName': { S: userBD.firstName },
        ':lastName': { S: userBD.lastName },
        ':phoneNumber': { S: userBD.phoneNumber },
        ':profilePictureUrl': { S: userBD.profilePictureUrl || ""  },
        ':estado': { BOOL: userBD.estado }
      },
    });
    await this.dynamoService.dynamoCliente.send(updateCommand);
    
    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);
    
    // Registra la actividad
    await this.activitiesService.create({
      userId: id,
      activityType: 'ACTUALIZACIÓN DE USUARIO',
      detail: `Usuario actualizado correctamente.`,
      ip: userIp
    });
    res.cookie('user', JSON.stringify(userBD), {httpOnly: false,secure: false,sameSite: 'strict',domain: 'localhost', expires: new Date(new Date().setFullYear(9999))});
    res.status(200).send({ message: 'Usuario actulizado correctamente.'});
  }

  //ACTUALIZAR CONTRASEÑA 
  async updatePasswordUser(id: string, dto: UpdatePasswordDTO, request: Request) {
    // Verificamos que el usuario exista
    const userDB = await this.findOne(id);

    // preparacion de la consulta
    const command = new GetCommand({
      TableName: 'users',
      Key: {
        primaryKey: id ,
      },
      ProjectionExpression: 'password',
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);

    // Verificamos que el usuario existe y tiene contraseña
    if (!Item || !Item.password)
      throw new NotFoundException('Usuario no encontrado.');

    const passwordMatch = await bcrypt.compare(dto.oldPassword, Item.password);
    if (!passwordMatch)
      throw new NotFoundException('Contraseña incorrecta.');

    //Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 15);

    //preparacion consulta de actualizacion
    const updateCommand = new UpdateItemCommand({
      TableName: 'users',
      Key: {
        primaryKey: { S: id },
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': { S: hashedNewPassword },  // Actualizamos la contraseña
        ':updatedAt': { N: new Date().getTime().toString() },
      },
    });
    await this.dynamoService.dynamoCliente.send(updateCommand);

    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);

    // Registra la actividad
    await this.activitiesService.create({
      userId: id,
      activityType: 'ACTUALIZACIÓN DE CONTRASEÑA',
      detail: `Contraseña actualizada correctamente.`,
      ip: userIp
    });

    return { message: 'Contraseña actualizada correctamente.'};
  }

  //LOGUEAR
  async login(loginUserDTO: LoginDTO, request: Request, userAgent: string, res: ExpressResponse) {
    //validacion de de recapcha 
    const recapcha = await this.verifyRecapcha(loginUserDTO.recaptchaResponse);
    if(!recapcha)
      throw new NotFoundException('Acceso no autorizado.');

    //validar si existe el email
    const userBDId = await this.findOneByEmail(loginUserDTO.email);
    if (userBDId === "x") 
      throw new NotFoundException('Usuario no encontrado.');

    // preparacion de la consulta
    const command = new GetCommand({
      TableName: 'users',
      Key: {
        primaryKey: userBDId,
      },
      ProjectionExpression: 'password, estado',
    });
    const {Item} = await this.dynamoService.dynamoCliente.send(command);
    
    // Verificamos que el usuario existe y tiene contraseña
    if (!Item || !Item.password)
      throw new NotFoundException('Usuario no encontrado.');

    //verificamos el estado 
    if (Item.estado === false)
      throw new NotFoundException('Usuario no encontrado.');

    // Comparamos la contraseña
    const passwordMatch = await bcrypt.compare(loginUserDTO.password, Item.password);
    if (!passwordMatch) 
      throw new NotFoundException('Contraseña incorrecta.');
    
    // Obtiene la IP del usuario de forma segura
    const userIp = this.extractUserIp(request);
    
    // Registra la actividad
    await this.activitiesService.create({
      userId: userBDId,
      activityType: 'INICIO DE SESIÓN',
      detail: 'Inicio de sesión exitoso',
      ip: userIp
    });

    //usuario logueado
    const userAuth = await this.findOne(userBDId);

    // crear el token
    const token = await this.sesionService.create({userId: userBDId,ip: userIp,userAgent: userAgent,userType: userAuth.userType});
    
    //colocar la cookie en la respuesta - token
    res.cookie('access_token', token, {httpOnly: true,secure: false,sameSite: 'strict',domain: 'localhost', expires: new Date(new Date().setFullYear(9999))});

    //colocar la cookie en la respuesta - user
    res.cookie('user', JSON.stringify(userAuth), {httpOnly: false,secure: false,sameSite: 'strict',domain: 'localhost', expires: new Date(new Date().setFullYear(9999))});

    //devolver el usuario logueado
    res.status(200).send({message: 'Acceso autorizado.', userType: userAuth.userType});
  }
  
  // Buscar por email y retorna el ID del email
  private async findOneByEmail(email: string) {
    const command = new QueryCommand({
      TableName: 'users',
      IndexName: 'email-index',//GSI
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    });
    const {Items} = await this.dynamoService.dynamoCliente.send(command);

    // Si no se encuentra el usuario, lanzamos una excepción
    if (!Items || Items.length === 0)return "x";

    // Retorna el ID del usuario si existe
    return Items[0].primaryKey.S;
  }

  // Buscar si el usuario es admin
  async findOneByIdAdmin(id: string) {
    const userBD = await this.findOne(id);
    // Verifica si el tipo de usuario es 'admin'
    if (userBD.userType !== "admin")
        throw new NotFoundException('Este usuario no está permitido que realize esta acción.');
    // Verifica si el estado del usuario tiene el estado en falso
    if (userBD.estado === false)
      throw new NotFoundException('Este usuario no está permitido que realize esta acción.');
  }

  // Función para extraer la IP del usuario
  private extractUserIp(request: Request): string {
    let userIp = Array.isArray(request.headers['x-forwarded-for'])
      ? request.headers['x-forwarded-for'][0]
      : (request.headers['x-forwarded-for'] as string) || request.ip;
    return userIp === '::1' ? '127.0.0.1' : userIp;
  }

  //VERIFICAR RECAPCHA
  async verifyRecapcha(recaptchaResponse: string): Promise<boolean> {
    const secretkey = process.env.RECAPTCHA_SECRET_KEY;
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    try {
      const { data } = await axios.get(url, {
        params: {
          secret: secretkey,
          response: recaptchaResponse
        }
      });
      if(data){
        return true;
      }else{
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async logout(req: Request, res: ExpressResponse){
    const access_token = this.extractToken(req)
    if(!access_token)
      throw new UnauthorizedException('Acceso no autorizado.');
    //logica para colocar en inactiva la cuenta
    await this.sesionService.deactivateSession(access_token);
    res.clearCookie('access_token', {httpOnly: true,secure: false,sameSite: 'strict',domain: 'localhost'});
    res.clearCookie('user', {httpOnly: false,secure: false,sameSite: 'strict',domain: 'localhost'});
    res.status(200).send({ message: 'Sesión cerrada correctamente.'});
  }
  
  // Extracción del token desde las cookies
  private extractToken(request: Request) {
    // Si existe la cookie access_token, la devolvemos
    return request.cookies?.access_token;
  }
}
