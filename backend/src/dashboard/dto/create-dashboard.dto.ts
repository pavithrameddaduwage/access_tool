import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDashboardDto {

    @IsString()
    @IsNotEmpty()
    dashboard: string;

    @IsArray()
    @IsNumber({}, { each: true })
    typeIds: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    valueTypeIds: number[];

    @IsArray()
    @IsNumber({}, { each: true })
    workspaceIds: number[];

    @IsNumber()
    @IsNotEmpty()
    groupId?: number;
}

