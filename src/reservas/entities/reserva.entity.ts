import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Pasajero } from "./pasajero.entity";

@ObjectType()
export class Reserva {

    @Field()
    primaryKey: string;       // Identificador único de la reserva
    
    @Field()
    idUsuario: string;        // ID del usuario que realiza la reserva
    
    @Field()
    idViaje: string;          // ID del viaje asociado (viaje específico con fecha)
    
    @Field(() => Int)
    fechaViaje: number;       // Fecha y hora del viaje
    
    @Field()
    estado: EstadoReserva;    // Estado de la reserva (PENDIENTE, CONFIRMADA, CANCELADA)
    
    @Field()
    pasajeros: Pasajero[];

    @Field(() => Int)
    createdAt: number;

    @Field(() => Int,{nullable: true})
    updatedAt?: number;

    @Field(() => Int)
    costoUnitario: number; // Costo por pasajero o asiento
    
    @Field(() => Int)
    costoTotal: number; 
}

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CANCELADA = 'CANCELADA',
}