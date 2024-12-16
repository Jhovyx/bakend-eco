import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  @Get('reserva/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.findOne(id);
  }

  @Get('user/:id')
  findOneByUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.findReservasByUser(id);
  }

  @Patch('reserva/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateReservaDto: UpdateReservaDto) {
    return this.reservasService.updatecancel(id, updateReservaDto);
  }
}
