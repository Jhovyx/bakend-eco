import { IsArray, IsEnum, Min, IsNumber, IsInt, IsString, IsUUID, MinLength, ValidateNested } from "class-validator";
import { EstadoReserva } from "../entities/reserva.entity";
import { Pasajero } from "../entities/pasajero.entity";
import { Type } from "class-transformer";
import { PasajeroDto } from "./create-pasajero.dto";

export class CreateReservaDto {

    @IsString()
    @MinLength(1)
    @IsUUID()
    idUsuario: string;  // ID del usuario que realiza la reserva

    @IsString()
    @MinLength(1)
    @IsUUID()
    idViaje: string;  // ID del viaje asociado (viaje específico con fecha)

    @IsInt()
    fechaViaje: number;  // Fecha y hora del viaje (timestamp)

    @IsString()
    @MinLength(1)
    @IsEnum(EstadoReserva)
    estado: EstadoReserva;  // Estado de la reserva (PENDIENTE, CONFIRMADA, CANCELADA)

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PasajeroDto)
    pasajeros: Pasajero[];  // Lista de pasajeros asociados a la reserva

    @IsNumber()
    @Min(1)
    costoUnitario: number; // Costo por pasajero o asiento
    
    @IsNumber()
    @Min(1)
    costoTotal: number; 
}
