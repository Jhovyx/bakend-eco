import { IsIn, IsString, IsUUID, MinLength } from "class-validator";

export class CreateSesioneDto {

    @IsString()
    @MinLength(1)
    @IsUUID()
    readonly userId: string;
    
    @IsString()
    @MinLength(1)
    @IsIn(['cliente', 'admin'])
    readonly userType: string;

    @IsString()
    @MinLength(1)
    readonly ip: string;

    @IsString()
    @MinLength(1)
    readonly userAgent: string;
}
