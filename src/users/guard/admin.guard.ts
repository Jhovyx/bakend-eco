import {CanActivate,ExecutionContext,Injectable,UnauthorizedException,} from '@nestjs/common';
import { JwtService} from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ){}
  //metodo para validar rutas
   async canActivate(context: ExecutionContext,) {
    //obtener el request de la peticcion
    const request = context.switchToHttp().getRequest()
    //validacion si hay token
    const token = this.extractToken(request)
    if(!token)
      throw new UnauthorizedException('Acceso no autorizado.');
    try {
      //verificar si tiene la firma
      const payload = await this.jwtService.verifyAsync(token,{secret: process.env.JWT_SECRET})
      //verificar si existe e payload
      if(!payload)
        throw new UnauthorizedException('Acceso no autorizado.');
      //verificar si el rol es admin
      if(payload.userType !== 'admin')
        throw new UnauthorizedException('Acceso no autorizado.');
      return true;
    } catch (error) {
      throw new UnauthorizedException('Acceso no autorizado.');
    }
  }

  // Extracción del token desde las cookies
  private extractToken(request: Request) {
    // Si existe la cookie access_token, la devolvemos
    return request.cookies?.access_token;
  }
}
