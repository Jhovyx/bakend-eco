import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Asiento } from './entities/asiento.entity';

@WebSocketGateway(3001, { namespace: 'asientos' })
export class AsientosGateway {

  @WebSocketServer() server;

  emitAsientoActualizado(asiento: Asiento) {
    this.server.emit('asientoActualizado', asiento); // Emite a todos los clientes conectados
  }

}
