import { IsString, IsNotEmpty, IsUUID, IsDateString, IsInt, Min, MaxLength, IsEnum, Matches, MinLength } from 'class-validator';

export class CreatePagoDto {
  
  @IsUUID() // Asegura que sea un UUID válido
  @MinLength(1)
  idReserva: string;

  @IsString() // Asegura que sea una cadena de texto
  @MinLength(1)
  @MaxLength(16) // Limita la longitud a 16 caracteres
  @Matches(/^\d{16}$/)
  numeroTarjeta: string;

  @IsString() // Asegura que sea una cadena de texto
  @MinLength(1)
  @IsEnum(['visa', 'mastercard', 'americanexpress', 'bcp', 'interbank'])
  tipoTarjeta: string;

  @IsDateString() // Asegura que sea una fecha en formato ISO 8601
  @MinLength(1)
  fechaVencimiento: string;

  @IsString() // Asegura que sea una cadena de texto
  @MinLength(1)
  @Matches(/^\d{3,4}$/,)
  codigoSeguridad: string;

  @Min(1) // Asegura que el monto sea mayor o igual a 0
  monto: number;

  @IsString()
  @MinLength(1)
  @IsUUID()
  idUsuario: string;
}
