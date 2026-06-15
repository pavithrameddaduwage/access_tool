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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaAgentController = void 0;
const common_1 = require("@nestjs/common");
const qa_agent_service_1 = require("./qa-agent.service");
const qa_run_options_dto_1 = require("./dto/qa-run-options.dto");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
let QaAgentController = class QaAgentController {
    constructor(qaAgentService) {
        this.qaAgentService = qaAgentService;
    }
    async runQa(options) {
        return this.qaAgentService.runAllChecks(options);
    }
};
exports.QaAgentController = QaAgentController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('run'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [qa_run_options_dto_1.QaRunOptionsDto]),
    __metadata("design:returntype", Promise)
], QaAgentController.prototype, "runQa", null);
exports.QaAgentController = QaAgentController = __decorate([
    (0, common_1.Controller)('qa'),
    __metadata("design:paramtypes", [qa_agent_service_1.QaAgentService])
], QaAgentController);
//# sourceMappingURL=qa-agent.controller.js.map