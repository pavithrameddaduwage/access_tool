"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWebtoolUserDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_webtool_user_dto_1 = require("./create-webtool-user.dto");
class UpdateWebtoolUserDto extends (0, mapped_types_1.PartialType)(create_webtool_user_dto_1.CreateWebtoolUserDto) {
}
exports.UpdateWebtoolUserDto = UpdateWebtoolUserDto;
//# sourceMappingURL=update-webtool-user.dto.js.map