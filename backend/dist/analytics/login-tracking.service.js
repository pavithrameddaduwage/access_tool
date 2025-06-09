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
exports.LoginTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const login_event_entity_1 = require("./entities/login-event.entity");
let LoginTrackingService = class LoginTrackingService {
    constructor(loginEventRepository) {
        this.loginEventRepository = loginEventRepository;
    }
    async recordLogin(email, webtool, req, department, location) {
        const timezone = req.headers['timezone']?.toString() || 'UTC';
        const loginEvent = this.loginEventRepository.create({
            email,
            webtool,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            department,
            location,
            timezone,
            loginTime: new Date()
        });
        return this.loginEventRepository.save(loginEvent);
    }
};
exports.LoginTrackingService = LoginTrackingService;
exports.LoginTrackingService = LoginTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_event_entity_1.LoginEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LoginTrackingService);
//# sourceMappingURL=login-tracking.service.js.map