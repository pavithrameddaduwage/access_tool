import { PartialType } from '@nestjs/mapped-types';
import { CreateReportMappingDto } from './create-report-mapping.dto';

export class UpdateReportMappingDto extends PartialType(CreateReportMappingDto) {}
