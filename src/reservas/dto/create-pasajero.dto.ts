import { IsBoolean, IsEmail, IsEnum, IsInt, IsPhoneNumber, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class PasajeroDto {

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;  // Primer nombre del pasajero

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName: string;  // Apellido del pasajero
    
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    documentType: string;  // Tipo de documento (DNI, pasaporte, etc.)
    
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    documentNumber: string;  // Número de documento

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    phoneNumber: string;  // Número de teléfono del pasajero

    @IsString()
    @MinLength(1)
    @IsEmail()
    email: string;  // Correo electrónico del pasajero
    
    @IsString()
    @MinLength(1)
    @IsUUID()
    idAsiento: string;  // Asiento asignado

    @IsBoolean()
    registered: boolean;
}
