import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DynamodbModule } from './dynamodb/dynamodb.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { BusesModule } from './buses/buses.module';
import { AsientosModule } from './asientos/asientos.module';
import { EstacionesModule } from './estaciones/estaciones.module';
import { ViajesModule } from './viajes/viajes.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { SesionesMiddleware } from './sesiones/sesiones.middleware';
import { ReservasModule } from './reservas/reservas.module';

@Module({
  imports: [DynamodbModule, UsersModule, ActivitiesModule, BusesModule, AsientosModule, EstacionesModule, ViajesModule, SesionesModule, ReservasModule],
  controllers: [],
  providers: [SesionesMiddleware],
})
export class AppModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SesionesMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }

}
