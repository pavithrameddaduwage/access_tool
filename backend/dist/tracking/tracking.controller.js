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
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const tracking_service_1 = require("./tracking.service");
const start_session_dto_1 = require("./dto/start-session.dto");
const flush_session_dto_1 = require("./dto/flush-session.dto");
const end_session_dto_1 = require("./dto/end-session.dto");
const log_view_dto_1 = require("./dto/log-view.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let TrackingController = class TrackingController {
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    async startSession(dto) {
        return this.trackingService.startSession(dto);
    }
    async flushSession(dto) {
        return this.trackingService.flushSession(dto);
    }
    async endSession(dto) {
        return this.trackingService.endSession(dto);
    }
    async logView(dto) {
        return this.trackingService.logView(dto);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('session/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_session_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "startSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('session/flush'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flush_session_dto_1.FlushSessionDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "flushSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('session/end'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [end_session_dto_1.EndSessionDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "endSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('view'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [log_view_dto_1.LogViewDto]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "logView", null);
exports.TrackingController = TrackingController = __decorate([
    (0, common_1.Controller)('api/tracking'),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
//# sourceMappingURL=tracking.controller.js.map