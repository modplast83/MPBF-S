"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bottleneckStorage = exports.BottleneckStorage = void 0;
var BottleneckStorage = /** @class */ (function () {
    function BottleneckStorage() {
        this.productionMetrics = [];
        this.bottleneckAlerts = [];
        this.notificationSettings = [];
        this.productionTargets = [];
        this.currentId = 1;
    }
    // Production Metrics methods
    BottleneckStorage.prototype.getProductionMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionMetrics];
            });
        });
    };
    BottleneckStorage.prototype.getProductionMetricsBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionMetrics.filter(function (metric) { return metric.sectionId === sectionId; })];
            });
        });
    };
    BottleneckStorage.prototype.getProductionMetricsByMachine = function (machineId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionMetrics.filter(function (metric) { return metric.machineId === machineId; })];
            });
        });
    };
    BottleneckStorage.prototype.getProductionMetricsByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionMetrics.filter(function (metric) {
                        return metric.timestamp >= startDate && metric.timestamp <= endDate;
                    })];
            });
        });
    };
    BottleneckStorage.prototype.createProductionMetric = function (metric) {
        return __awaiter(this, void 0, void 0, function () {
            var newMetric;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newMetric = __assign(__assign({}, metric), { id: this.currentId++, timestamp: new Date() });
                        this.productionMetrics.push(newMetric);
                        // Analyze for bottlenecks after adding new metric
                        return [4 /*yield*/, this.analyzeForBottlenecks(newMetric)];
                    case 1:
                        // Analyze for bottlenecks after adding new metric
                        _a.sent();
                        return [2 /*return*/, newMetric];
                }
            });
        });
    };
    // Bottleneck Alert methods
    BottleneckStorage.prototype.getBottleneckAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.bottleneckAlerts.sort(function (a, b) { return b.detectedAt.getTime() - a.detectedAt.getTime(); })];
            });
        });
    };
    BottleneckStorage.prototype.getActiveBottleneckAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.bottleneckAlerts.filter(function (alert) { return alert.status === 'active'; })];
            });
        });
    };
    BottleneckStorage.prototype.getBottleneckAlertsBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.bottleneckAlerts.filter(function (alert) { return alert.sectionId === sectionId; })];
            });
        });
    };
    BottleneckStorage.prototype.acknowledgeAlert = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            return __generator(this, function (_a) {
                alert = this.bottleneckAlerts.find(function (a) { return a.id === id; });
                if (alert) {
                    alert.status = 'acknowledged';
                    alert.acknowledgedAt = new Date();
                    alert.acknowledgedBy = userId;
                }
                return [2 /*return*/, alert];
            });
        });
    };
    BottleneckStorage.prototype.resolveAlert = function (id, userId, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            return __generator(this, function (_a) {
                alert = this.bottleneckAlerts.find(function (a) { return a.id === id; });
                if (alert) {
                    alert.status = 'resolved';
                    alert.resolvedAt = new Date();
                    alert.resolvedBy = userId;
                    alert.resolutionNotes = notes || '';
                }
                return [2 /*return*/, alert];
            });
        });
    };
    BottleneckStorage.prototype.createBottleneckAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var newAlert;
            return __generator(this, function (_a) {
                newAlert = __assign(__assign({}, alert), { id: this.currentId++, detectedAt: new Date(), acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null });
                this.bottleneckAlerts.push(newAlert);
                return [2 /*return*/, newAlert];
            });
        });
    };
    // Production Targets methods
    BottleneckStorage.prototype.getProductionTargets = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionTargets.filter(function (target) { return target.isActive; })];
            });
        });
    };
    BottleneckStorage.prototype.getProductionTargetsBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.productionTargets.filter(function (target) {
                        return target.sectionId === sectionId && target.isActive;
                    })];
            });
        });
    };
    BottleneckStorage.prototype.createProductionTarget = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var newTarget;
            return __generator(this, function (_a) {
                newTarget = __assign(__assign({}, target), { id: this.currentId++, effectiveFrom: new Date(), effectiveTo: null });
                this.productionTargets.push(newTarget);
                return [2 /*return*/, newTarget];
            });
        });
    };
    BottleneckStorage.prototype.updateProductionTarget = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var target;
            return __generator(this, function (_a) {
                target = this.productionTargets.find(function (t) { return t.id === id; });
                if (target) {
                    Object.assign(target, updates);
                }
                return [2 /*return*/, target];
            });
        });
    };
    // Notification Settings methods
    BottleneckStorage.prototype.getNotificationSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.notificationSettings];
            });
        });
    };
    BottleneckStorage.prototype.getNotificationSettingsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.notificationSettings.filter(function (setting) { return setting.userId === userId; })];
            });
        });
    };
    BottleneckStorage.prototype.createNotificationSetting = function (setting) {
        return __awaiter(this, void 0, void 0, function () {
            var newSetting;
            return __generator(this, function (_a) {
                newSetting = __assign(__assign({}, setting), { id: this.currentId++ });
                this.notificationSettings.push(newSetting);
                return [2 /*return*/, newSetting];
            });
        });
    };
    BottleneckStorage.prototype.updateNotificationSetting = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var setting;
            return __generator(this, function (_a) {
                setting = this.notificationSettings.find(function (s) { return s.id === id; });
                if (setting) {
                    Object.assign(setting, updates);
                }
                return [2 /*return*/, setting];
            });
        });
    };
    // Bottleneck analysis logic
    BottleneckStorage.prototype.analyzeForBottlenecks = function (metric) {
        return __awaiter(this, void 0, void 0, function () {
            var targets, relevantTarget, alerts, _i, alerts_1, alert_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getProductionTargetsBySection(metric.sectionId)];
                    case 1:
                        targets = _a.sent();
                        relevantTarget = targets.find(function (t) {
                            return t.stage === metric.stage &&
                                t.shift === metric.shift &&
                                (!t.machineId || t.machineId === metric.machineId);
                        });
                        if (!relevantTarget)
                            return [2 /*return*/];
                        alerts = [];
                        // Check efficiency drop
                        if (metric.efficiency < relevantTarget.minEfficiency) {
                            alerts.push({
                                alertType: 'efficiency_drop',
                                severity: metric.efficiency < 50 ? 'critical' : metric.efficiency < 65 ? 'high' : 'medium',
                                sectionId: metric.sectionId,
                                machineId: metric.machineId,
                                title: "Efficiency Drop Detected - ".concat(metric.stage),
                                description: "Efficiency dropped to ".concat(metric.efficiency.toFixed(1), "% (target: ").concat(relevantTarget.minEfficiency, "%)"),
                                affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
                                estimatedDelay: this.calculateEstimatedDelay(metric.efficiency, relevantTarget.minEfficiency),
                                suggestedActions: this.getSuggestedActions('efficiency_drop', metric),
                                status: 'active'
                            });
                        }
                        // Check production rate below target
                        if (metric.actualRate < relevantTarget.targetRate * 0.8) {
                            alerts.push({
                                alertType: 'rate_below_target',
                                severity: metric.actualRate < relevantTarget.targetRate * 0.5 ? 'critical' : 'high',
                                sectionId: metric.sectionId,
                                machineId: metric.machineId,
                                title: "Production Rate Below Target - ".concat(metric.stage),
                                description: "Current rate: ".concat(metric.actualRate.toFixed(1), " units/hr (target: ").concat(relevantTarget.targetRate.toFixed(1), " units/hr)"),
                                affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
                                estimatedDelay: this.calculateDelayFromRate(metric.actualRate, relevantTarget.targetRate),
                                suggestedActions: this.getSuggestedActions('rate_below_target', metric),
                                status: 'active'
                            });
                        }
                        // Check excessive downtime
                        if (metric.downtime && metric.downtime > relevantTarget.maxDowntime) {
                            alerts.push({
                                alertType: 'downtime_exceeded',
                                severity: metric.downtime > relevantTarget.maxDowntime * 2 ? 'critical' : 'high',
                                sectionId: metric.sectionId,
                                machineId: metric.machineId,
                                title: "Excessive Downtime - ".concat(metric.stage),
                                description: "Downtime: ".concat(metric.downtime, " minutes (max allowed: ").concat(relevantTarget.maxDowntime, " minutes)"),
                                affectedJobOrders: metric.jobOrderId ? [metric.jobOrderId] : [],
                                estimatedDelay: Math.ceil(metric.downtime / 60),
                                suggestedActions: this.getSuggestedActions('downtime_exceeded', metric),
                                status: 'active'
                            });
                        }
                        _i = 0, alerts_1 = alerts;
                        _a.label = 2;
                    case 2:
                        if (!(_i < alerts_1.length)) return [3 /*break*/, 5];
                        alert_1 = alerts_1[_i];
                        return [4 /*yield*/, this.createBottleneckAlert(alert_1)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BottleneckStorage.prototype.calculateEstimatedDelay = function (actualEfficiency, targetEfficiency) {
        var efficiencyRatio = targetEfficiency / actualEfficiency;
        return Math.ceil((efficiencyRatio - 1) * 8); // Estimate delay in hours for an 8-hour shift
    };
    BottleneckStorage.prototype.calculateDelayFromRate = function (actualRate, targetRate) {
        var rateRatio = targetRate / actualRate;
        return Math.ceil((rateRatio - 1) * 4); // Estimate delay in hours
    };
    BottleneckStorage.prototype.getSuggestedActions = function (alertType, metric) {
        switch (alertType) {
            case 'efficiency_drop':
                return [
                    'Check machine calibration and settings',
                    'Inspect raw material quality',
                    'Review operator training status',
                    'Verify maintenance schedule compliance',
                    'Check for equipment wear or damage'
                ];
            case 'rate_below_target':
                return [
                    'Optimize machine speed settings',
                    'Check for material flow issues',
                    'Review job setup parameters',
                    'Inspect for mechanical bottlenecks',
                    'Consider additional operator support'
                ];
            case 'downtime_exceeded':
                return [
                    'Investigate root cause of downtime',
                    'Check preventive maintenance schedule',
                    'Review spare parts availability',
                    'Ensure adequate technical support',
                    'Consider backup equipment activation'
                ];
            default:
                return ['Contact production supervisor for immediate assessment'];
        }
    };
    // Analytics methods
    BottleneckStorage.prototype.getEfficiencyTrends = function (sectionId_1) {
        return __awaiter(this, arguments, void 0, function (sectionId, days) {
            var startDate, metrics, sectionMetrics;
            if (days === void 0) { days = 7; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);
                        return [4 /*yield*/, this.getProductionMetricsByDateRange(startDate, new Date())];
                    case 1:
                        metrics = _a.sent();
                        sectionMetrics = metrics.filter(function (m) { return m.sectionId === sectionId; });
                        return [2 /*return*/, {
                                averageEfficiency: sectionMetrics.reduce(function (sum, m) { return sum + m.efficiency; }, 0) / sectionMetrics.length || 0,
                                dailyTrends: this.groupMetricsByDay(sectionMetrics),
                                alertCount: this.bottleneckAlerts.filter(function (a) {
                                    return a.sectionId === sectionId &&
                                        a.detectedAt >= startDate;
                                }).length
                            }];
                }
            });
        });
    };
    BottleneckStorage.prototype.groupMetricsByDay = function (metrics) {
        var grouped = metrics.reduce(function (acc, metric) {
            var date = metric.timestamp.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date: date, metrics: [] };
            }
            acc[date].metrics.push(metric);
            return acc;
        }, {});
        return Object.values(grouped).map(function (day) { return ({
            date: day.date,
            averageEfficiency: day.metrics.reduce(function (sum, m) { return sum + m.efficiency; }, 0) / day.metrics.length,
            totalDowntime: day.metrics.reduce(function (sum, m) { return sum + (m.downtime || 0); }, 0),
            averageRate: day.metrics.reduce(function (sum, m) { return sum + m.actualRate; }, 0) / day.metrics.length
        }); });
    };
    return BottleneckStorage;
}());
exports.BottleneckStorage = BottleneckStorage;
exports.bottleneckStorage = new BottleneckStorage();
