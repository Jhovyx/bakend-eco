import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Pasajero {

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    documentType: string;
    
    @Field()
    documentNumber: string;

    @Field()
    phoneNumber: string;

    @Field()
    email: string;
    
    @Field()
    idAsiento: string;

    @Field(() => Boolean)
    registered: boolean;
}