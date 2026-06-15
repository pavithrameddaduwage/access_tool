"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QaAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaAgentService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
let QaAgentService = QaAgentService_1 = class QaAgentService {
    constructor() {
        this.logger = new common_1.Logger(QaAgentService_1.name);
    }
    async runAllChecks(options) {
        const start = Date.now();
        this.logger.log(`QA run requested (targetEnv=${options.targetEnv ?? 'local'})`);
        const checkResults = [];
        const passedCount = checkResults.filter((c) => c.passed).length;
        const failedCount = checkResults.length - passedCount;
        const issues = checkResults.flatMap((c) => c.issues);
        return {
            runDate: new Date().toISOString(),
            branch: this.getBranch(),
            durationMs: Date.now() - start,
            passedCount,
            failedCount,
            totalChecks: checkResults.length,
            issues,
            markdown: '# PowerBI QA Agent Report\n\n_Scaffold ready — no checks wired yet._\n',
            checkResults: options.verbose
                ? checkResults
                : checkResults.map(({ raw, ...rest }) => rest),
        };
    }
    getBranch() {
        try {
            return (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        }
        catch {
            return 'unknown';
        }
    }
};
exports.QaAgentService = QaAgentService;
exports.QaAgentService = QaAgentService = QaAgentService_1 = __decorate([
    (0, common_1.Injectable)()
], QaAgentService);
//# sourceMappingURL=qa-agent.service.js.map