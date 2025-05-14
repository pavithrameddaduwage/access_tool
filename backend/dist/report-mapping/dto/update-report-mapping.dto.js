"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReportMappingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_report_mapping_dto_1 = require("./create-report-mapping.dto");
class UpdateReportMappingDto extends (0, mapped_types_1.PartialType)(create_report_mapping_dto_1.CreateReportMappingDto) {
}
exports.UpdateReportMappingDto = UpdateReportMappingDto;
//# sourceMappingURL=update-report-mapping.dto.js.map