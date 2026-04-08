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
exports.TouchpointController = void 0;
const common_1 = require("@nestjs/common");
const touchpoint_service_1 = require("./touchpoint.service");
const touchpoint_dto_1 = require("./dto/touchpoint.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TouchpointController = class TouchpointController {
    touchpointService;
    constructor(touchpointService) {
        this.touchpointService = touchpointService;
    }
    create(createTouchpointDto, user) {
        return this.touchpointService.create(createTouchpointDto, user);
    }
    findAll(user) {
        return this.touchpointService.findAll(user);
    }
    findOne(id, user) {
        return this.touchpointService.findOne(id, user);
    }
    update(id, updateTouchpointDto, user) {
        return this.touchpointService.update(id, updateTouchpointDto, user);
    }
    remove(id, user) {
        return this.touchpointService.remove(id, user);
    }
};
exports.TouchpointController = TouchpointController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [touchpoint_dto_1.CreateTouchpointDto, Object]),
    __metadata("design:returntype", void 0)
], TouchpointController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TouchpointController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TouchpointController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, touchpoint_dto_1.UpdateTouchpointDto, Object]),
    __metadata("design:returntype", void 0)
], TouchpointController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TouchpointController.prototype, "remove", null);
exports.TouchpointController = TouchpointController = __decorate([
    (0, common_1.Controller)('touchpoints'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [touchpoint_service_1.TouchpointService])
], TouchpointController);
//# sourceMappingURL=touchpoint.controller.js.map