import { IsNumber, IsString, IsUUID, Min, MinLength, IsEnum, IsOptional, Max } from 'class-validator';
import { EstadoAsiento } from '../entities/asiento.entity';

export class CreateAsientoDto {

  @IsNumber()
  @Min(1)
  @Max(40)
  readonly numero: number;

  @IsString()
  @MinLength(1)
  @IsUUID()
  readonly idBus: string; // Relación con el bus, debe ser un UUID

  @IsString()
  @MinLength(1)
  @IsUUID()
  readonly userAdminId: string; // ID del usuario administrador que registra el asiento, debe ser un UUID

  @IsOptional()
  @IsString()
  @MinLength(1)
  @IsUUID()
  readonly reservadoPor?: string; // ID del usuario que ha reservado el asiento, es opcional
}
