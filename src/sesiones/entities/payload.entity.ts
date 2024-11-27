import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class JwtPayload {

  @Field() 
  userId: string;

  @Field() 
  userType: string; // ID del usuario

  @Field() 
  refreshToken: string;  // Refresh token asociado a la sesión.

  @Field() 
  primaryKey: string; //Identificador único de la sesión

  @Field()
  iat?: number;

  @Field()
  exp?: number;

}
