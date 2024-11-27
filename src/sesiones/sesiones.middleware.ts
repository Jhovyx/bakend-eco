import { Injectable, NestMiddleware, Req, Res , UnauthorizedException } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { NextFunction, Request, Response as ExpressResponse } from 'express';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SesionesMiddleware implements NestMiddleware {

  constructor(
    private readonly sesionService: SesionesService
  ){}

  async use(@Req() req: Request, @Res() res: ExpressResponse, next: NextFunction) {
    const tokenCookie = req.cookies['access_token'];
    const userCookie = req.cookies['user'];

    if(tokenCookie && userCookie) {
      const payload = await this.sesionService.verifyAllToken(tokenCookie);
      const user: User = JSON.parse(userCookie);
      
      //verificar si la sesion esta activa si no limpiarla
      const isActive = await this.sesionService.verifySesion(payload.primaryKey);
      if (!isActive) {
        res.clearCookie('access_token');
        res.clearCookie('user');
        throw new UnauthorizedException();
      }

      if(payload.userId !== user.primaryKey) 
        throw new UnauthorizedException();

      if(payload.userType !== user.userType)
        throw new UnauthorizedException();


      //verificar la fecha de expiracion si esta en los proximos 10 minutos a vencer o si ya vencio
      const fechaHoraActual = Math.floor(Date.now() / 1000);
      const fechaHoraExpiracion = payload.exp;
      const minutosAvencer = 10 * 60;

      if(fechaHoraExpiracion - fechaHoraActual <= minutosAvencer){
        const token = await this.sesionService.refrechToken(payload, user);
    
        //colocar la cookie en la respuesta - token
        res.cookie('access_token', token, {httpOnly: true,secure: false,sameSite: 'strict',domain: 'localhost', expires: new Date(new Date().setFullYear(9999))});
      }
      
    }
    
    next();
  }
}
