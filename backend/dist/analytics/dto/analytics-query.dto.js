"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsQueryDto = exports.DEFAULT_PERIOD = exports.PERIOD_DAYS = exports.PERIODS = void 0;
exports.periodToDays = periodToDays;
const class_validator_1 = require("class-validator");
exports.PERIODS = ['7d', '30d', '90d'];
exports.PERIOD_DAYS = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
};
exports.DEFAULT_PERIOD = '30d';
class AnalyticsQueryDto {
}
exports.AnalyticsQueryDto = AnalyticsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.PERIODS),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "department", void 0);
function periodToDays(period) {
    return exports.PERIOD_DAYS[period ?? exports.DEFAULT_PERIOD];
}
//# sourceMappingURL=analytics-query.dto.js.map