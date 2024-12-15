import { Controller, Get, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { AsientosService } from './asientos.service';
import { UpdateAsientoDto } from './dto/update-asiento.dto';

@Controller('asientos')
export class AsientosController {
  constructor(private readonly asientosService: AsientosService) {}

  @Get()
  findAll() {
    return this.asientosService.findAll();
  }

  @Get('bus/:id')
  findAllBusId(@Param('id', ParseUUIDPipe) id: string) {
    return this.asientosService.findAsientosByBus(id);
  }

  @Get('asiento/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.asientosService.findOne(id);
  }

  @Patch('seleccion/:id')//seleccion de asiento
  seleccionar(@Param('id', ParseUUIDPipe) id: string, @Body() updateAsientoDto: UpdateAsientoDto) {
    return this.asientosService.selectAsiento(id, updateAsientoDto);
  }

  @Patch('deseleccionar/:id') // Deselección de asiento
  deseleccionar(@Param('id', ParseUUIDPipe) id: string, @Body() updateAsientoDto: UpdateAsientoDto) {
    return this.asientosService.deseleccionarAsiento(id, updateAsientoDto);
  }
}
