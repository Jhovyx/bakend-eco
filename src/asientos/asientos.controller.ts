import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { AsientosService } from './asientos.service';
import { CreateAsientoDto } from './dto/create-asiento.dto';
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

  @Patch(':id')//seleccion de asiento
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAsientoDto: UpdateAsientoDto) {
    return this.asientosService.selectAsiento(id, updateAsientoDto);
  }
}
