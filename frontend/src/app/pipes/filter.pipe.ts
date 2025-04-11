// src/app/pipes/filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], field: string, value: any): any[] {
    if (!items) return [];
    if (!value || value.length === 0) return items;
    return items.filter(item => item[field] === value);
  }
}

@Pipe({
  name: 'find'
})
export class FindPipe implements PipeTransform {
  transform(items: any[], value: any, field: string = 'id'): any {
    if (!items) return null;
    if (!value) return null;
    return items.find(item => item[field] === value);
  }
}