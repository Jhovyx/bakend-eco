import { Module } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { SesionesController } from './sesiones.controller';
import { JwtModule } from '@nestjs/jwt';
import { DynamodbModule } from 'src/dynamodb/dynamodb.module';

@Module({
  controllers: [SesionesController],
  providers: [SesionesService],
  imports: [
    JwtModule.register({global: true, secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1h' }, }),
    DynamodbModule
  ],
  exports: [SesionesService]
})
export class SesionesModule {}
