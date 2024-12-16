import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Pago {

    @Field()
    primaryKey: string;       // Identificador único del pago

    @Field()
    idReserva: string;        // ID de la reserva asociada (referencia a un viaje específico)

    @Field(() => Int)
    createdAt: number;        // Fecha de creación del pago en formato de timestamp

    @Field()
    fechaVencimiento: string; // Fecha de vencimiento de la tarjeta

    @Field(() => Int)
    monto: number;            // Monto total del pago

    @Field()
    codigoSeguridad: string;  // Código de seguridad de la tarjeta

    @Field()
    tipoTarjeta: string;      // Tipo de tarjeta (Visa, Mastercard, etc.)

    @Field()
    numeroTarjeta: string;    // Número de la tarjeta (sin mostrar los últimos dígitos por seguridad)

    @Field()
    idUsuario: string;
}
