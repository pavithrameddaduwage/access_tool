import { PartialType } from '@nestjs/mapped-types';
import { CreatePowerbiMetricDto } from './create-powerbi-metric.dto';

export class UpdatePowerbiMetricDto extends PartialType(CreatePowerbiMetricDto) {}
