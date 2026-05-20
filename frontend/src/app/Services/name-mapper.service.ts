// src/app/Services/name-mapper.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NameMapperService {
  private workspaceReplacements = [
    { pattern: /^HGU\s*-\s*/i, replacement: '' }, 
    { pattern: /^HGU/i, replacement: '' }, 
    { pattern: /\s*-\s*Dashboard$/i, replacement: '' }, 
    { pattern: /Dashboard$/i, replacement: '' }, 
    { pattern: /^\s+|\s+$/g, replacement: '' } 
  ];

  private reportReplacements = [
    { pattern: /^HGU\s*-\s*/i, replacement: '' }, 
    { pattern: /^HGU/i, replacement: '' }, 
    { pattern: /\s*-\s*Dashboard$/i, replacement: '' }, 
    { pattern: /Dashboard$/i, replacement: '' }, 
    { pattern: /^\s+|\s+$/g, replacement: '' } 
  ];

  transformWorkspaceName(name: string | undefined | null): string {
    if (!name) return 'Unknown Workspace';
    return this.applyTransformations(name, this.workspaceReplacements) || 'Unknown Workspace';
  }

  transformReportName(name: string | undefined | null): string {
    if (!name) return 'Unknown Report';
    return this.applyTransformations(name, this.reportReplacements) || 'Unknown Report';
  }

  private applyTransformations(input: string, transformations: {pattern: RegExp, replacement: string}[]): string {
    let result = input;
    for (const {pattern, replacement} of transformations) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }
}