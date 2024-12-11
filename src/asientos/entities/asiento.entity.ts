import { ObjectType, Field, Int } from '@nestjs/graphql';

// Definimos el enum para los estados del asiento
export enum EstadoAsiento {DISPONIBLE = 'DISPONIBLE',SELECCIONADO = 'SELECCIONADO',RESERVADO = 'RESERVADO',}

@ObjectType()
export class Asiento {
  @Field()
  primaryKey: string;

  @Field(() => Int)
  numero: number; // Número del asiento

  @Field()
  idBus: string; // ID del bus al que pertenece el asiento

  @Field()
  userAdminId: string; // ID del usuario que registró el asiento en el sistema

  @Field({ nullable: true })
  timestampSeleccion?: number; // Marca de tiempo de cuando se seleccionó el asiento 

  @Field(() => EstadoAsiento)
  estado: EstadoAsiento;

  @Field({ nullable: true })
  reservadoPor?: string; // ID del usuario que ha seleccionado o reservado el asiento

  @Field(() => Int)
  createdAt: number;

  @Field(() => Int, { nullable: true })
  updatedAt?: number;
}
