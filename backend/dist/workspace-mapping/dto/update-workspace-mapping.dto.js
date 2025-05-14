"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkspaceMappingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_workspace_mapping_dto_1 = require("./create-workspace-mapping.dto");
class UpdateWorkspaceMappingDto extends (0, mapped_types_1.PartialType)(create_workspace_mapping_dto_1.CreateWorkspaceMappingDto) {
}
exports.UpdateWorkspaceMappingDto = UpdateWorkspaceMappingDto;
//# sourceMappingURL=update-workspace-mapping.dto.js.map