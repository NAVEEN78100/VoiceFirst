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
exports.DashboardFiltersDto = exports.DashboardTimeBucket = void 0;
const class_validator_1 = require("class-validator");
var DashboardTimeBucket;
(function (DashboardTimeBucket) {
    DashboardTimeBucket["TODAY"] = "today";
    DashboardTimeBucket["LAST_7_DAYS"] = "last_7_days";
    DashboardTimeBucket["LAST_30_DAYS"] = "last_30_days";
    DashboardTimeBucket["THIS_MONTH"] = "this_month";
    DashboardTimeBucket["CUSTOM"] = "custom";
})(DashboardTimeBucket || (exports.DashboardTimeBucket = DashboardTimeBucket = {}));
class DashboardFiltersDto {
    preset = DashboardTimeBucket.LAST_7_DAYS;
    startDate;
    endDate;
    branchId;
}
exports.DashboardFiltersDto = DashboardFiltersDto;
__decorate([
    (0, class_validator_1.IsEnum)(DashboardTimeBucket),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DashboardFiltersDto.prototype, "preset", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DashboardFiltersDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DashboardFiltersDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DashboardFiltersDto.prototype, "branchId", void 0);
//# sourceMappingURL=dashboard-filters.dto.js.map