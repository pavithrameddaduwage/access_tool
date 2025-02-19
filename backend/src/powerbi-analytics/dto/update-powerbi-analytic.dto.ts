import { PartialType } from '@nestjs/mapped-types';
import { CreatePowerbiAnalyticDto } from './create-powerbi-analytic.dto';

export class UpdatePowerbiAnalyticDto extends PartialType(CreatePowerbiAnalyticDto) {}
