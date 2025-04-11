"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePowerbiMetricDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_powerbi_metric_dto_1 = require("./create-powerbi-metric.dto");
class UpdatePowerbiMetricDto extends (0, mapped_types_1.PartialType)(create_powerbi_metric_dto_1.CreatePowerbiMetricDto) {
}
exports.UpdatePowerbiMetricDto = UpdatePowerbiMetricDto;
//# sourceMappingURL=update-powerbi-metric.dto.js.map