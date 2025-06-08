"use strict";
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
exports.setupBottleneckRoutes = setupBottleneckRoutes;
var bottleneck_storage_1 = require("./bottleneck-storage");
var schema_1 = require("@shared/schema");
function setupBottleneckRoutes(app) {
    var _this = this;
    // Production Metrics endpoints
    app.get("/api/production/metrics", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, section, machine, startDate, endDate, metrics, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    _a = req.query, section = _a.section, machine = _a.machine, startDate = _a.startDate, endDate = _a.endDate;
                    metrics = void 0;
                    if (!section) return [3 /*break*/, 2];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionMetricsBySection(section)];
                case 1:
                    metrics = _b.sent();
                    return [3 /*break*/, 8];
                case 2:
                    if (!machine) return [3 /*break*/, 4];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionMetricsByMachine(machine)];
                case 3:
                    metrics = _b.sent();
                    return [3 /*break*/, 8];
                case 4:
                    if (!(startDate && endDate)) return [3 /*break*/, 6];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionMetricsByDateRange(new Date(startDate), new Date(endDate))];
                case 5:
                    metrics = _b.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionMetrics()];
                case 7:
                    metrics = _b.sent();
                    _b.label = 8;
                case 8:
                    res.json(metrics);
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error("Error fetching production metrics:", error_1);
                    res.status(500).json({ error: "Failed to fetch production metrics" });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/production/metrics", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var validatedData, metric, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validatedData = schema_1.insertProductionMetricsSchema.parse(req.body);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.createProductionMetric(validatedData)];
                case 1:
                    metric = _a.sent();
                    res.json(metric);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error creating production metric:", error_2);
                    res.status(500).json({ error: "Failed to create production metric" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Bottleneck Alerts endpoints
    app.get("/api/bottleneck/alerts", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, status_1, section, alerts, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    _a = req.query, status_1 = _a.status, section = _a.section;
                    alerts = void 0;
                    if (!(status_1 === 'active')) return [3 /*break*/, 2];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getActiveBottleneckAlerts()];
                case 1:
                    alerts = _b.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!section) return [3 /*break*/, 4];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getBottleneckAlertsBySection(section)];
                case 3:
                    alerts = _b.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getBottleneckAlerts()];
                case 5:
                    alerts = _b.sent();
                    _b.label = 6;
                case 6:
                    res.json(alerts);
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _b.sent();
                    console.error("Error fetching bottleneck alerts:", error_3);
                    res.status(500).json({ error: "Failed to fetch bottleneck alerts" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/bottleneck/alerts", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var validatedData, alert_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validatedData = schema_1.insertBottleneckAlertSchema.parse(req.body);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.createBottleneckAlert(validatedData)];
                case 1:
                    alert_1 = _a.sent();
                    res.json(alert_1);
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error("Error creating bottleneck alert:", error_4);
                    res.status(500).json({ error: "Failed to create bottleneck alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.put("/api/bottleneck/alerts/:id/acknowledge", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, userId, alert_2, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    id = parseInt(req.params.id);
                    userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.acknowledgeAlert(id, userId)];
                case 1:
                    alert_2 = _b.sent();
                    if (!alert_2) {
                        return [2 /*return*/, res.status(404).json({ error: "Alert not found" })];
                    }
                    res.json(alert_2);
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _b.sent();
                    console.error("Error acknowledging alert:", error_5);
                    res.status(500).json({ error: "Failed to acknowledge alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.put("/api/bottleneck/alerts/:id/resolve", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, userId, notes, alert_3, error_6;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    id = parseInt(req.params.id);
                    userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
                    notes = req.body.notes;
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.resolveAlert(id, userId, notes)];
                case 1:
                    alert_3 = _b.sent();
                    if (!alert_3) {
                        return [2 /*return*/, res.status(404).json({ error: "Alert not found" })];
                    }
                    res.json(alert_3);
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _b.sent();
                    console.error("Error resolving alert:", error_6);
                    res.status(500).json({ error: "Failed to resolve alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Production Targets endpoints
    app.get("/api/production/targets", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var section, targets, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    section = req.query.section;
                    targets = void 0;
                    if (!section) return [3 /*break*/, 2];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionTargetsBySection(section)];
                case 1:
                    targets = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionTargets()];
                case 3:
                    targets = _a.sent();
                    _a.label = 4;
                case 4:
                    res.json(targets);
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _a.sent();
                    console.error("Error fetching production targets:", error_7);
                    res.status(500).json({ error: "Failed to fetch production targets" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/production/targets", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var validatedData, target, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validatedData = schema_1.insertProductionTargetsSchema.parse(req.body);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.createProductionTarget(validatedData)];
                case 1:
                    target = _a.sent();
                    res.json(target);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error creating production target:", error_8);
                    res.status(500).json({ error: "Failed to create production target" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.put("/api/production/targets/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, target, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = parseInt(req.params.id);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.updateProductionTarget(id, req.body)];
                case 1:
                    target = _a.sent();
                    if (!target) {
                        return [2 /*return*/, res.status(404).json({ error: "Target not found" })];
                    }
                    res.json(target);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.error("Error updating production target:", error_9);
                    res.status(500).json({ error: "Failed to update production target" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Notification Settings endpoints
    app.get("/api/notification/settings", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, settings, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    userId = req.query.userId;
                    settings = void 0;
                    if (!userId) return [3 /*break*/, 2];
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getNotificationSettingsByUser(userId)];
                case 1:
                    settings = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getNotificationSettings()];
                case 3:
                    settings = _a.sent();
                    _a.label = 4;
                case 4:
                    res.json(settings);
                    return [3 /*break*/, 6];
                case 5:
                    error_10 = _a.sent();
                    console.error("Error fetching notification settings:", error_10);
                    res.status(500).json({ error: "Failed to fetch notification settings" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/notification/settings", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var validatedData, setting, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validatedData = schema_1.insertNotificationSettingsSchema.parse(req.body);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.createNotificationSetting(validatedData)];
                case 1:
                    setting = _a.sent();
                    res.json(setting);
                    return [3 /*break*/, 3];
                case 2:
                    error_11 = _a.sent();
                    console.error("Error creating notification setting:", error_11);
                    res.status(500).json({ error: "Failed to create notification setting" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.put("/api/notification/settings/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, setting, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = parseInt(req.params.id);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.updateNotificationSetting(id, req.body)];
                case 1:
                    setting = _a.sent();
                    if (!setting) {
                        return [2 /*return*/, res.status(404).json({ error: "Setting not found" })];
                    }
                    res.json(setting);
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _a.sent();
                    console.error("Error updating notification setting:", error_12);
                    res.status(500).json({ error: "Failed to update notification setting" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Analytics endpoints
    app.get("/api/production/analytics/efficiency/:sectionId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sectionId, days, trends, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sectionId = req.params.sectionId;
                    days = parseInt(req.query.days) || 7;
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getEfficiencyTrends(sectionId, days)];
                case 1:
                    trends = _a.sent();
                    res.json(trends);
                    return [3 /*break*/, 3];
                case 2:
                    error_13 = _a.sent();
                    console.error("Error fetching efficiency trends:", error_13);
                    res.status(500).json({ error: "Failed to fetch efficiency trends" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Dashboard overview endpoint
    app.get("/api/bottleneck/dashboard", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var activeAlerts, recentMetrics, yesterday_1, last24Hours, overallEfficiency, alertsBySeverity, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getActiveBottleneckAlerts()];
                case 1:
                    activeAlerts = _a.sent();
                    return [4 /*yield*/, bottleneck_storage_1.bottleneckStorage.getProductionMetrics()];
                case 2:
                    recentMetrics = _a.sent();
                    yesterday_1 = new Date();
                    yesterday_1.setDate(yesterday_1.getDate() - 1);
                    last24Hours = recentMetrics.filter(function (m) { return m.timestamp >= yesterday_1; });
                    overallEfficiency = last24Hours.length > 0
                        ? last24Hours.reduce(function (sum, m) { return sum + m.efficiency; }, 0) / last24Hours.length
                        : 0;
                    alertsBySeverity = activeAlerts.reduce(function (acc, alert) {
                        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                        return acc;
                    }, {});
                    res.json({
                        activeAlerts: activeAlerts.length,
                        alertsBySeverity: alertsBySeverity,
                        overallEfficiency: Math.round(overallEfficiency * 100) / 100,
                        metricsCount: last24Hours.length,
                        criticalAlerts: activeAlerts.filter(function (a) { return a.severity === 'critical'; }).length,
                        topBottlenecks: activeAlerts
                            .sort(function (a, b) {
                            var severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                            return (severityOrder[b.severity] || 0) -
                                (severityOrder[a.severity] || 0);
                        })
                            .slice(0, 5)
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_14 = _a.sent();
                    console.error("Error fetching dashboard data:", error_14);
                    res.status(500).json({ error: "Failed to fetch dashboard data" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
