"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const dotenv = require("dotenv");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
dotenv.config({ path: (0, path_1.join)(__dirname, '../.env') });
const logger = new common_1.Logger('Bootstrap');
async function bootstrap() {
    process.env.TZ = 'America/New_York';
    const dbHost = process.env.PG_DB_HOST || 'localhost';
    const dbPort = process.env.PG_DB_PORT || '5432';
    const dbName = process.env.PG_DB_NAME || 'access_tool';
    logger.log(`Connecting to database → ${dbHost}:${dbPort}/${dbName} ...`);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    try {
        const dataSource = app.get(typeorm_1.DataSource);
        if (dataSource.isInitialized) {
            logger.log(`✅  Database connected  (${dbHost}:${dbPort}/${dbName})`);
        }
        else {
            logger.error(`❌  Database NOT connected  (${dbHost}:${dbPort}/${dbName})`);
        }
    }
    catch (err) {
        logger.error(`❌  Database connection check failed: ${err.message}`);
    }
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization, timezone',
        exposedHeaders: 'Content-Range,X-Content-Range',
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    await app.listen(process.env.PORT ?? 4019);
    logger.log(`🚀  Server running on port ${process.env.PORT ?? 4019}`);
}
bootstrap();
//# sourceMappingURL=main.js.map