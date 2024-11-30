import { Injectable, NestMiddleware, Req, Res , UnauthorizedException } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { NextFunction, Request, Response as ExpressResponse } from 'express';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SesionesMiddleware implements NestMiddleware {

  constructor(
    private readonly sesionService: SesionesService,
    private readonly usersService: UsersService,
  ){}

  async use(@Req() req: Request, @Res() res: ExpressResponse, next: NextFunction) {
    const tokenCookie = req.cookies['access_token'];
    const userCookie = req.cookies['user'];
    const requestedUrl = req.url; //url de la peticion
    const method = req.method;//metodo de la peticion

    if(tokenCookie && userCookie) {
      const payload = await this.sesionService.verifyAllToken(tokenCookie);
      const user: User = JSON.parse(userCookie);

      if(payload.userId !== user.primaryKey) 
        throw new UnauthorizedException();
      
      if(payload.userType !== user.userType)
        throw new UnauthorizedException();

      if(payload.userType !== 'cliente' && payload.userType !=='admin')
        throw new UnauthorizedException();

      //verificar rutas para el cliente y admin
      if(payload.userType === 'admin'){
  
        // Buscar si la ruta y el método coinciden con las rutas de administrador permitidas
        const routeProtection = this.adminRoutes.find(route => {
          const routeWithParam = route.url.replace(':id', '[^/]+');
          return requestedUrl.match(new RegExp(`^${routeWithParam}$`)) && route.methods.includes(method);        
        });
  
        // Si no se encuentra la ruta o el método
        if (!routeProtection)
          throw new UnauthorizedException();

      }

      if(payload.userType === 'cliente'){

        // Buscar si la ruta y el método coinciden con las rutas de cliente permitidas
        const routeProtection = this.clientRoutes.find(route => {
          const routeWithParam = route.url.replace(':id', '[^/]+');
          return requestedUrl.match(new RegExp(`^${routeWithParam}$`)) && route.methods.includes(method);        
        });

        // Si no se encuentra la ruta o el método, devolver error
        if (!routeProtection)
          throw new UnauthorizedException();

      }

      //verificar si el usuario tiene el estado activo
      const {estado} = await this.usersService.findOne(user.primaryKey);
      if(estado !== true){
        res.clearCookie('access_token');
        res.clearCookie('user');
        throw new UnauthorizedException();
      }
      
      //verificar si la sesion esta activa si no limpiarla
      const isActive = await this.sesionService.verifySesion(payload.primaryKey);
      if (!isActive) {
        res.clearCookie('access_token');
        res.clearCookie('user');
        throw new UnauthorizedException();
      }

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

    if(!tokenCookie && !userCookie){

      // Verificar si la ruta solicitada es accesible sin autenticación y con el método correcto
      const routeProtection = this.noAuthRoutes.find(route => {
        const routeWithParam = route.url.replace(':id', '[^/]+');
        return requestedUrl.match(new RegExp(`^${routeWithParam}$`)) && route.methods.includes(method);        
      });

      // Si no coincide con una ruta pública permitida, lanza UnauthorizedException
      if (!routeProtection)
        throw new UnauthorizedException();

    }
    
    next();
  }

  adminRoutes = [
    { url: '/v1/users', methods: ['GET', 'POST'] }, //OBTENER USUARIO Y CREAR
    { url: '/v1/users/:id', methods: ['PATCH'] }, //ACTULIZAR UN USUARIO
    { url: '/v1/users/user/:id', methods: ['GET'] }, //OBTENER USUARIO POR ID
    { url: '/v1/users/logout', methods: ['GET'] }, //CERRAR SESION
    { url: '/v1/users/password/:id', methods: ['GET'] }, //CAMBIAR CONTRASEÑA
    
    { url: '/v1/viajes', methods: ['GET', 'POST'] }, //OBTENER VIAJES, CREAR
    { url: '/v1/viajes/:id', methods: ['GET'] }, //OBTENER VIAJE POR ID
    { url: '/v1/viajes/:id', methods: ['PATCH'] }, //ACTULIZAR UN VIAJE

    { url: '/v1/estaciones', methods: ['GET', 'POST'] }, //OBTENER ESTACIONES Y CREAR
    { url: '/v1/estaciones/:id', methods: ['GET'] }, //OBTENER ESTACION POR ID
    { url: '/v1/estaciones/:id', methods: ['PATCH'] }, //ACTULIZAR ESTACION POR ID

    { url: '/v1/buses', methods: ['GET', 'POST'] }, //OBTENER BUSES Y CREAR
    { url: '/v1/buses/:id', methods: ['GET'] }, //OBTENER BUS POR ID
    { url: '/v1/buses/:id', methods: ['PATCH'] }, //ACTULIZAR BUS POR ID

    { url: '/v1/activities', methods: ['GET'] }, //OBTENER ACTIVIDADES
    { url: '/v1/activities/:id', methods: ['GET'] }, //OBTENER ACTIVIDADES POR ID

  ];

  clientRoutes = [
    { url: '/v1/users/user/:id', methods: ['GET'] }, //OBTENER USUARIO POR ID
    { url: '/v1/users/:id', methods: ['PATCH'] }, //ACTULIZAR UN USUARIO
    { url: '/v1/users/password/:id', methods: ['GET'] }, //CAMBIAR CONTRASEÑA
    { url: '/v1/users/logout', methods: ['GET'] }, //CERRAR SESION
    
    //ACTIVOS
    { url: '/v1/viajes/:id', methods: ['GET'] }, //OBTENER VIAJE POR ID

    { url: '/v1/estaciones/:id', methods: ['GET'] }, //OBTENER ESTACION POR ID

    { url: '/v1/buses/:id', methods: ['GET'] }, //OBTENER BUS POR ID
  ];

  noAuthRoutes = [
    { url: '/v1/users', methods: ['POST'] }, //CREAR
    { url: '/v1/users/login', methods: ['POST'] }, //LOGIN

    //ACTIVOS
    { url: '/v1/viajes', methods: ['GET'] }, //OBTENER VIAJES ACTIVOS
  ];

}