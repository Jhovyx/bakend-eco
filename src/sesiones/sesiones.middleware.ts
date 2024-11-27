import { Injectable, NestMiddleware, Req, Res, UnauthorizedException } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { NextFunction } from 'express';

@Injectable()
export class SesionesMiddleware implements NestMiddleware {

  constructor(
    private readonly sesionService: SesionesService
  ){}

  async use(@Req() req: Request, @Res() res: Response, next: NextFunction) {
    
    const cookieHeader = req.headers['cookie'];

    if (cookieHeader) {
      const cookies = this.parseCookies(cookieHeader);

      const tokenCookie = cookies['access_token'];
      const userCookie = cookies['user'];

      if(tokenCookie && userCookie) {
        const payload = await this.sesionService.verifyAllToken(tokenCookie);
        const user = JSON.parse(userCookie);
        
        if(payload.userId !== user.primaryKey) 
          throw new UnauthorizedException();

        if(payload.userType !== user.userType)
          throw new UnauthorizedException();
      }

    }
    next();
  }

  private parseCookies(cookieHeader: string): { [key: string]: string } {
    return cookieHeader.split(';').reduce((cookies: { [key: string]: string }, cookie) => {
      const [name, value] = cookie.split('=').map(part => part.trim());
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
  }
}
