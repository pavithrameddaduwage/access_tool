"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserMappingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_user_mapping_dto_1 = require("./create-user-mapping.dto");
class UpdateUserMappingDto extends (0, mapped_types_1.PartialType)(create_user_mapping_dto_1.CreateUserMappingDto) {
}
exports.UpdateUserMappingDto = UpdateUserMappingDto;
//# sourceMappingURL=update-user-mapping.dto.js.map