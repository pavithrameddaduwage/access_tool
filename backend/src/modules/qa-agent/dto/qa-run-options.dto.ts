import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

/** Body of `POST /qa/run`. */
export class QaRunOptionsDto {
  /** Run only these checks (by name). Omit to run all. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checks?: string[];

  /** Include raw tool outputs in each CheckResult. */
  @IsOptional()
  @IsBoolean()
  verbose?: boolean;

  /** Target environment. Only 'local' is supported; 'staging' is reserved. */
  @IsOptional()
  @IsIn(['local', 'staging'])
  targetEnv?: 'local' | 'staging';
}
