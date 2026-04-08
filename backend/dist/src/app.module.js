"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const two_factor_module_1 = require("./two-factor/two-factor.module");
const branch_module_1 = require("./branch/branch.module");
const touchpoint_module_1 = require("./touchpoint/touchpoint.module");
const feedback_module_1 = require("./feedback/feedback.module");
const case_module_1 = require("./case/case.module");
const events_module_1 = require("./events/events.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const messaging_module_1 = require("./messaging/messaging.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => [
                    {
                        ttl: 1000,
                        limit: 1000,
                    },
                ],
            }),
            event_emitter_1.EventEmitterModule.forRoot({ wildcard: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            two_factor_module_1.TwoFactorModule,
            branch_module_1.BranchModule,
            touchpoint_module_1.TouchpointModule,
            feedback_module_1.FeedbackModule,
            dashboard_module_1.DashboardModule,
            case_module_1.CaseModule,
            events_module_1.EventsModule,
            messaging_module_1.MessagingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map