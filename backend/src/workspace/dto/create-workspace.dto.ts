import { IsNotEmpty, IsString } from "class-validator";

export class CreateWorkspaceDto {
       @IsString()
          @IsNotEmpty()
          workspace: string; 
}
