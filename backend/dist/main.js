"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const dotenv = require("dotenv");
const net_1 = require("net");
const path_1 = require("path");
dotenv.config({ path: (0, path_1.join)(__dirname, '../.env') });
async function isPortAvailable(port) {
    return new Promise(resolve => {
        const server = (0, net_1.createServer)();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port);
    });
}
async function findAvailablePort(startPort) {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port += 1;
    }
    return port;
}
async function bootstrap() {
    process.env.TZ = 'America/New_York';
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization, timezone',
        exposedHeaders: 'Content-Range,X-Content-Range',
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const preferredPort = Number.parseInt(process.env.PORT ?? '4006', 10);
    const startingPort = Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : 4006;
    const port = await findAvailablePort(startingPort);
    if (port !== startingPort) {
        logger.warn(`Port ${startingPort} is in use. Starting the backend on port ${port} instead.`);
    }
    await app.listen(port);
    logger.log(`Backend is listening on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map