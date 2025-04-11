import { PipeTransform } from '@nestjs/common';
export declare class ParseISO8601DatePipe implements PipeTransform<string, Date> {
    transform(value: string): Date;
}
