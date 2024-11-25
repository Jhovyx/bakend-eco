import * as dotenv from 'dotenv';   //IMPORTAR PARA CARGAR LAS VARIBLES
dotenv.config();                    //CARGA LAS VARIABLES DE ENTORNO

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  //HABILITACION DE CORS
  app.enableCors({
    origin: 'http://localhost:4200',        // La URL de tu frontend
    credentials: true,                      //PERMITIR COOKIES Y CREDENCIALES
  });

  //CONFIG GLOBAL
  app.useGlobalPipes(new ValidationPipe()); //VALIDACION
  app.setGlobalPrefix('v1');                 //PREFIJO

  //HABILITAR EL MANEJO DE COOKIES
  app.use(cookieParser());

  await app.listen(3000);                     //PUERTO
}
bootstrap();
