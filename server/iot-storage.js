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
exports.iotStorage = exports.IotStorage = void 0;
var db_1 = require("./db");
var schema_1 = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
var IotStorage = /** @class */ (function () {
    function IotStorage() {
    }
    // Machine Sensors
    IotStorage.prototype.getMachineSensors = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.machineSensors)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.getMachineSensorsByMachine = function (machineId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.machineSensors).where((0, drizzle_orm_1.eq)(schema_1.machineSensors.machineId, machineId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.getMachineSensor = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.machineSensors).where((0, drizzle_orm_1.eq)(schema_1.machineSensors.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.createMachineSensor = function (sensor) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.machineSensors).values(sensor).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.updateMachineSensor = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.machineSensors)
                            .set(updates)
                            .where((0, drizzle_orm_1.eq)(schema_1.machineSensors.id, id))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.deleteMachineSensor = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.machineSensors).where((0, drizzle_orm_1.eq)(schema_1.machineSensors.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Sensor Data
    IotStorage.prototype.getSensorData = function (sensorId_1) {
        return __awaiter(this, arguments, void 0, function (sensorId, limit) {
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.sensorData)
                            .where((0, drizzle_orm_1.eq)(schema_1.sensorData.sensorId, sensorId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.sensorData.timestamp))
                            .limit(limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.getSensorDataByDateRange = function (sensorId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.sensorData)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.sensorData.sensorId, sensorId), (0, drizzle_orm_1.gte)(schema_1.sensorData.timestamp, startDate), (0, drizzle_orm_1.lte)(schema_1.sensorData.timestamp, endDate)))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.sensorData.timestamp))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.createSensorData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.sensorData).values(data).returning()];
                    case 1:
                        result = _a.sent();
                        // Check for threshold violations and create alerts if needed
                        return [4 /*yield*/, this.checkThresholds(data.sensorId, data.value)];
                    case 2:
                        // Check for threshold violations and create alerts if needed
                        _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.getLatestSensorData = function (sensorId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.sensorData)
                            .where((0, drizzle_orm_1.eq)(schema_1.sensorData.sensorId, sensorId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.sensorData.timestamp))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    // IoT Alerts
    IotStorage.prototype.getIotAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.iotAlerts).orderBy((0, drizzle_orm_1.desc)(schema_1.iotAlerts.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.getActiveIotAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.iotAlerts)
                            .where((0, drizzle_orm_1.eq)(schema_1.iotAlerts.isActive, true))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.iotAlerts.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.getIotAlertsBySensor = function (sensorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.iotAlerts)
                            .where((0, drizzle_orm_1.eq)(schema_1.iotAlerts.sensorId, sensorId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.iotAlerts.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IotStorage.prototype.createIotAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.iotAlerts).values(alert).returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.acknowledgeIotAlert = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.iotAlerts)
                            .set({ acknowledgedBy: userId, acknowledgedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.iotAlerts.id, id))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    IotStorage.prototype.resolveIotAlert = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.iotAlerts)
                            .set({
                            resolvedBy: userId,
                            resolvedAt: new Date(),
                            isActive: false
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.iotAlerts.id, id))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    // Private method to check thresholds and create alerts
    IotStorage.prototype.checkThresholds = function (sensorId, value) {
        return __awaiter(this, void 0, void 0, function () {
            var sensor, alertType, severity, thresholdValue, existingAlert;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMachineSensor(sensorId)];
                    case 1:
                        sensor = _a.sent();
                        if (!sensor)
                            return [2 /*return*/];
                        alertType = '';
                        severity = '';
                        thresholdValue = 0;
                        if (sensor.criticalThreshold !== null &&
                            ((sensor.sensorType === 'temperature' && value > sensor.criticalThreshold) ||
                                (sensor.sensorType === 'pressure' && value > sensor.criticalThreshold) ||
                                (sensor.sensorType === 'vibration' && value > sensor.criticalThreshold))) {
                            alertType = 'threshold_exceeded';
                            severity = 'critical';
                            thresholdValue = sensor.criticalThreshold;
                        }
                        else if (sensor.warningThreshold !== null &&
                            ((sensor.sensorType === 'temperature' && value > sensor.warningThreshold) ||
                                (sensor.sensorType === 'pressure' && value > sensor.warningThreshold) ||
                                (sensor.sensorType === 'vibration' && value > sensor.warningThreshold))) {
                            alertType = 'threshold_exceeded';
                            severity = 'warning';
                            thresholdValue = sensor.warningThreshold;
                        }
                        if (!alertType) return [3 /*break*/, 4];
                        return [4 /*yield*/, db_1.db.select()
                                .from(schema_1.iotAlerts)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.iotAlerts.sensorId, sensorId), (0, drizzle_orm_1.eq)(schema_1.iotAlerts.isActive, true), (0, drizzle_orm_1.eq)(schema_1.iotAlerts.alertType, alertType)))
                                .limit(1)];
                    case 2:
                        existingAlert = _a.sent();
                        if (!(existingAlert.length === 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createIotAlert({
                                sensorId: sensorId,
                                alertType: alertType,
                                severity: severity,
                                message: "".concat(sensor.name, " ").concat(severity, " threshold exceeded"),
                                currentValue: value,
                                thresholdValue: thresholdValue,
                                isActive: true
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Analytics methods
    IotStorage.prototype.getSensorAnalytics = function (sensorId_1) {
        return __awaiter(this, arguments, void 0, function (sensorId, hours) {
            var startDate, data, values, average, min, max, latest, firstHalf, secondHalf, firstAvg, secondAvg, trend;
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
                        return [4 /*yield*/, this.getSensorDataByDateRange(sensorId, startDate, new Date())];
                    case 1:
                        data = _a.sent();
                        if (data.length === 0) {
                            return [2 /*return*/, {
                                    average: 0,
                                    min: 0,
                                    max: 0,
                                    latest: 0,
                                    trend: 'stable',
                                    dataPoints: []
                                }];
                        }
                        values = data.map(function (d) { return d.value; });
                        average = values.reduce(function (sum, val) { return sum + val; }, 0) / values.length;
                        min = Math.min.apply(Math, values);
                        max = Math.max.apply(Math, values);
                        latest = values[0];
                        firstHalf = values.slice(0, Math.floor(values.length / 2));
                        secondHalf = values.slice(Math.floor(values.length / 2));
                        firstAvg = firstHalf.reduce(function (sum, val) { return sum + val; }, 0) / firstHalf.length;
                        secondAvg = secondHalf.reduce(function (sum, val) { return sum + val; }, 0) / secondHalf.length;
                        trend = 'stable';
                        if (secondAvg > firstAvg * 1.05)
                            trend = 'increasing';
                        else if (secondAvg < firstAvg * 0.95)
                            trend = 'decreasing';
                        return [2 /*return*/, {
                                average: Math.round(average * 100) / 100,
                                min: min,
                                max: max,
                                latest: latest,
                                trend: trend,
                                dataPoints: data.map(function (d) { return ({
                                    timestamp: d.timestamp,
                                    value: d.value,
                                    status: d.status
                                }); })
                            }];
                }
            });
        });
    };
    return IotStorage;
}());
exports.IotStorage = IotStorage;
exports.iotStorage = new IotStorage();
