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
exports.setupIotRoutes = setupIotRoutes;
var iot_storage_1 = require("./iot-storage");
var schema_1 = require("@shared/schema");
var auth_utils_1 = require("./auth-utils");
function setupIotRoutes(app) {
    var _this = this;
    // Machine Sensors
    app.get("/api/iot/sensors", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensors, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, iot_storage_1.iotStorage.getMachineSensors()];
                case 1:
                    sensors = _a.sent();
                    res.json(sensors);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error getting machine sensors:", error_1);
                    res.status(500).json({ error: "Failed to get machine sensors" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/sensors/machine/:machineId", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var machineId, sensors, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    machineId = req.params.machineId;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getMachineSensorsByMachine(machineId)];
                case 1:
                    sensors = _a.sent();
                    res.json(sensors);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error getting machine sensors:", error_2);
                    res.status(500).json({ error: "Failed to get machine sensors" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/sensors/:id", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, sensor, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = req.params.id;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getMachineSensor(id)];
                case 1:
                    sensor = _a.sent();
                    if (!sensor) {
                        return [2 /*return*/, res.status(404).json({ error: "Sensor not found" })];
                    }
                    res.json(sensor);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error getting sensor:", error_3);
                    res.status(500).json({ error: "Failed to get sensor" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/iot/sensors", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorData, sensor, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorData = schema_1.insertMachineSensorSchema.parse(req.body);
                    return [4 /*yield*/, iot_storage_1.iotStorage.createMachineSensor(sensorData)];
                case 1:
                    sensor = _a.sent();
                    res.json(sensor);
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error("Error creating sensor:", error_4);
                    res.status(500).json({ error: "Failed to create sensor" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/iot/sensors/:id", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, updates, sensor, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = req.params.id;
                    updates = req.body;
                    return [4 /*yield*/, iot_storage_1.iotStorage.updateMachineSensor(id, updates)];
                case 1:
                    sensor = _a.sent();
                    if (!sensor) {
                        return [2 /*return*/, res.status(404).json({ error: "Sensor not found" })];
                    }
                    res.json(sensor);
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error("Error updating sensor:", error_5);
                    res.status(500).json({ error: "Failed to update sensor" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/iot/sensors/:id", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = req.params.id;
                    return [4 /*yield*/, iot_storage_1.iotStorage.deleteMachineSensor(id)];
                case 1:
                    _a.sent();
                    res.json({ success: true });
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error("Error deleting sensor:", error_6);
                    res.status(500).json({ error: "Failed to delete sensor" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Sensor Data
    app.get("/api/iot/data/:sensorId", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorId, limit, data, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorId = req.params.sensorId;
                    limit = parseInt(req.query.limit) || 100;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getSensorData(sensorId, limit)];
                case 1:
                    data = _a.sent();
                    res.json(data);
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error getting sensor data:", error_7);
                    res.status(500).json({ error: "Failed to get sensor data" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/data/:sensorId/range", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorId, _a, startDate, endDate, data, error_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    sensorId = req.params.sensorId;
                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                    if (!startDate || !endDate) {
                        return [2 /*return*/, res.status(400).json({ error: "Start date and end date are required" })];
                    }
                    return [4 /*yield*/, iot_storage_1.iotStorage.getSensorDataByDateRange(sensorId, new Date(startDate), new Date(endDate))];
                case 1:
                    data = _b.sent();
                    res.json(data);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _b.sent();
                    console.error("Error getting sensor data range:", error_8);
                    res.status(500).json({ error: "Failed to get sensor data range" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/data/:sensorId/latest", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorId, data, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorId = req.params.sensorId;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getLatestSensorData(sensorId)];
                case 1:
                    data = _a.sent();
                    res.json(data);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.error("Error getting latest sensor data:", error_9);
                    res.status(500).json({ error: "Failed to get latest sensor data" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/iot/data", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorData, data, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorData = schema_1.insertSensorDataSchema.parse(req.body);
                    return [4 /*yield*/, iot_storage_1.iotStorage.createSensorData(sensorData)];
                case 1:
                    data = _a.sent();
                    res.json(data);
                    return [3 /*break*/, 3];
                case 2:
                    error_10 = _a.sent();
                    console.error("Error creating sensor data:", error_10);
                    res.status(500).json({ error: "Failed to create sensor data" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Analytics
    app.get("/api/iot/analytics/:sensorId", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorId, hours, analytics, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorId = req.params.sensorId;
                    hours = parseInt(req.query.hours) || 24;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getSensorAnalytics(sensorId, hours)];
                case 1:
                    analytics = _a.sent();
                    res.json(analytics);
                    return [3 /*break*/, 3];
                case 2:
                    error_11 = _a.sent();
                    console.error("Error getting sensor analytics:", error_11);
                    res.status(500).json({ error: "Failed to get sensor analytics" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // IoT Alerts
    app.get("/api/iot/alerts", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var alerts, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, iot_storage_1.iotStorage.getIotAlerts()];
                case 1:
                    alerts = _a.sent();
                    res.json(alerts);
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _a.sent();
                    console.error("Error getting IoT alerts:", error_12);
                    res.status(500).json({ error: "Failed to get IoT alerts" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/alerts/active", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var alerts, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, iot_storage_1.iotStorage.getActiveIotAlerts()];
                case 1:
                    alerts = _a.sent();
                    res.json(alerts);
                    return [3 /*break*/, 3];
                case 2:
                    error_13 = _a.sent();
                    console.error("Error getting active IoT alerts:", error_13);
                    res.status(500).json({ error: "Failed to get active IoT alerts" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/iot/alerts/sensor/:sensorId", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var sensorId, alerts, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sensorId = req.params.sensorId;
                    return [4 /*yield*/, iot_storage_1.iotStorage.getIotAlertsBySensor(sensorId)];
                case 1:
                    alerts = _a.sent();
                    res.json(alerts);
                    return [3 /*break*/, 3];
                case 2:
                    error_14 = _a.sent();
                    console.error("Error getting sensor alerts:", error_14);
                    res.status(500).json({ error: "Failed to get sensor alerts" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/iot/alerts", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var alertData, alert_1, error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    alertData = schema_1.insertIotAlertSchema.parse(req.body);
                    return [4 /*yield*/, iot_storage_1.iotStorage.createIotAlert(alertData)];
                case 1:
                    alert_1 = _a.sent();
                    res.json(alert_1);
                    return [3 /*break*/, 3];
                case 2:
                    error_15 = _a.sent();
                    console.error("Error creating IoT alert:", error_15);
                    res.status(500).json({ error: "Failed to create IoT alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/iot/alerts/:id/acknowledge", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, userId, alert_2, error_16;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    id = req.params.id;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: "User not authenticated" })];
                    }
                    return [4 /*yield*/, iot_storage_1.iotStorage.acknowledgeIotAlert(parseInt(id), userId)];
                case 1:
                    alert_2 = _b.sent();
                    if (!alert_2) {
                        return [2 /*return*/, res.status(404).json({ error: "Alert not found" })];
                    }
                    res.json(alert_2);
                    return [3 /*break*/, 3];
                case 2:
                    error_16 = _b.sent();
                    console.error("Error acknowledging IoT alert:", error_16);
                    res.status(500).json({ error: "Failed to acknowledge IoT alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/iot/alerts/:id/resolve", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, userId, alert_3, error_17;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    id = req.params.id;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: "User not authenticated" })];
                    }
                    return [4 /*yield*/, iot_storage_1.iotStorage.resolveIotAlert(parseInt(id), userId)];
                case 1:
                    alert_3 = _b.sent();
                    if (!alert_3) {
                        return [2 /*return*/, res.status(404).json({ error: "Alert not found" })];
                    }
                    res.json(alert_3);
                    return [3 /*break*/, 3];
                case 2:
                    error_17 = _b.sent();
                    console.error("Error resolving IoT alert:", error_17);
                    res.status(500).json({ error: "Failed to resolve IoT alert" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Bulk data endpoint for IoT devices
    app.post("/api/iot/data/bulk", auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var data, results, _i, data_1, item, sensorData, result, error_18, error_19;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    data = req.body.data;
                    if (!Array.isArray(data)) {
                        return [2 /*return*/, res.status(400).json({ error: "Data must be an array" })];
                    }
                    results = [];
                    _i = 0, data_1 = data;
                    _a.label = 1;
                case 1:
                    if (!(_i < data_1.length)) return [3 /*break*/, 6];
                    item = data_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    sensorData = schema_1.insertSensorDataSchema.parse(item);
                    return [4 /*yield*/, iot_storage_1.iotStorage.createSensorData(sensorData)];
                case 3:
                    result = _a.sent();
                    results.push(result);
                    return [3 /*break*/, 5];
                case 4:
                    error_18 = _a.sent();
                    console.error("Error processing bulk data item:", error_18);
                    results.push({ error: "Failed to process item", item: item });
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    res.json({ processed: results.length, results: results });
                    return [3 /*break*/, 8];
                case 7:
                    error_19 = _a.sent();
                    console.error("Error processing bulk sensor data:", error_19);
                    res.status(500).json({ error: "Failed to process bulk sensor data" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
}
