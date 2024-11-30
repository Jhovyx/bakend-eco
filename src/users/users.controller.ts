import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Req, Res, Headers, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { LoginDTO } from './dto/login-users.dto';
import { Request, Response as ExpressResponse } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() request: Request) {
    return this.usersService.create(createUserDto, request);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  
  @Get('user/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto, @Req() request: Request, @Res() res: ExpressResponse) {
    return this.usersService.update(id, updateUserDto, request, res);
  }

  @Patch('password/:id')
  updatePassword(@Param('id', ParseUUIDPipe) id: string, @Body() updatePassword: UpdatePasswordDTO, @Req() request: Request) {
    return this.usersService.updatePasswordUser(id, updatePassword, request);
  }

  @Post('login')
  login(@Body() loginUserDTO: LoginDTO, @Req() request: Request, @Res() res: ExpressResponse,
  @Headers('user-agent') userAgent: string) {
    return this.usersService.login(loginUserDTO, request, userAgent, res);
  }

  // Nueva ruta para cerrar sesión
  @Get('logout')
  logout(@Req() request: Request, @Res() res: ExpressResponse) {
    return this.usersService.logout(request, res);
  }

}
