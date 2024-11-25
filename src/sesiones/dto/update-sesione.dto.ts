import { PartialType } from '@nestjs/mapped-types';
import { CreateSesioneDto } from './create-sesione.dto';

export class UpdateSesioneDto extends PartialType(CreateSesioneDto) {}
