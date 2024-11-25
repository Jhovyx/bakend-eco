import { Field, Int } from "@nestjs/graphql";

export class Sesion {

    @Field()
    primaryKey: string;

    @Field()
    userId: string;
    
    @Field()
    userType: string;

    @Field()
    ip: string;

    @Field()
    userAgent: string;

    // Token JWT 
    @Field()
    token: string;

    // Refresh Token
    @Field()
    refreshToken: string;

    @Field(() => Boolean)
    estado: Boolean;

    @Field(() => Int,)
    createdAt: number;

    @Field(() => Int,{nullable: true})
    updatedAt?: number;

}
