import { Injectable, NestMiddleware, Req, Res } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { NextFunction } from 'express';

@Injectable()
export class SesionesMiddleware implements NestMiddleware {

  constructor(
    private readonly sesionService: SesionesService
  ){}

  use(@Req() req: Request, @Res() res: Response, next: NextFunction) {
    
    const cookieHeader = req.headers['cookie'];

    console.log(cookieHeader)

    next();
   
  }
}
