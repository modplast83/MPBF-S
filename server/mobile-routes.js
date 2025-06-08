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
exports.setupMobileRoutes = setupMobileRoutes;
var auth_utils_1 = require("./auth-utils");
var storage_1 = require("./storage");
function setupMobileRoutes(app) {
    var _this = this;
    // Get production metrics for mobile dashboard
    app.get('/api/production/metrics', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var currentTime, shiftStart, allJobOrders, activeJobs, today_1, completedToday, produced, target, efficiency, maintenanceRequests, pendingTasks, qualityViolations, alerts, metrics, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    currentTime = new Date();
                    shiftStart = new Date(currentTime);
                    shiftStart.setHours(8, 0, 0, 0); // Assume 8 AM shift start
                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                case 1:
                    allJobOrders = _a.sent();
                    activeJobs = allJobOrders.filter(function (job) {
                        return job.status === 'in_progress' || job.status === 'started';
                    }).length;
                    today_1 = new Date();
                    today_1.setHours(0, 0, 0, 0);
                    completedToday = allJobOrders.filter(function (job) {
                        // Use receiveDate as a proxy for completion date since createdAt might not exist
                        var completionDate = job.receiveDate ? new Date(job.receiveDate) : new Date();
                        return completionDate >= today_1 && job.status === 'completed';
                    });
                    produced = completedToday.reduce(function (sum, job) { return sum + (job.quantity || 0); }, 0);
                    target = 1000;
                    efficiency = target > 0 ? Math.min((produced / target) * 100, 100) : 0;
                    return [4 /*yield*/, storage_1.storage.getMaintenanceRequests()];
                case 2:
                    maintenanceRequests = _a.sent();
                    pendingTasks = maintenanceRequests.filter(function (req) { return req.status === 'pending'; }).length;
                    return [4 /*yield*/, storage_1.storage.getQualityViolations()];
                case 3:
                    qualityViolations = _a.sent();
                    alerts = qualityViolations.filter(function (violation) { return violation.status === 'open'; }).length;
                    metrics = {
                        currentShift: {
                            startTime: shiftStart.toISOString(),
                            target: target,
                            produced: produced,
                            efficiency: Math.round(efficiency * 100) / 100
                        },
                        activeJobs: activeJobs,
                        pendingTasks: pendingTasks,
                        alerts: alerts
                    };
                    res.json(metrics);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error fetching production metrics:', error_1);
                    res.status(500).json({ error: 'Failed to fetch production metrics' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Start production action
    app.post('/api/production/start', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source;
        var _b;
        return __generator(this, function (_c) {
            try {
                _a = req.body, timestamp = _a.timestamp, source = _a.source;
                // Log the action
                console.log("Production started via ".concat(source, " at ").concat(timestamp, " by user ").concat((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                // Here you would typically update production status in the database
                // For now, we'll just return success
                res.json({
                    success: true,
                    message: 'Production started successfully',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error starting production:', error);
                res.status(500).json({ error: 'Failed to start production' });
            }
            return [2 /*return*/];
        });
    }); });
    // Pause production action
    app.post('/api/production/pause', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source;
        var _b;
        return __generator(this, function (_c) {
            try {
                _a = req.body, timestamp = _a.timestamp, source = _a.source;
                console.log("Production paused via ".concat(source, " at ").concat(timestamp, " by user ").concat((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                res.json({
                    success: true,
                    message: 'Production paused successfully',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error pausing production:', error);
                res.status(500).json({ error: 'Failed to pause production' });
            }
            return [2 /*return*/];
        });
    }); });
    // Report issue action
    app.post('/api/issues', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source, _b, description;
        var _c;
        return __generator(this, function (_d) {
            try {
                _a = req.body, timestamp = _a.timestamp, source = _a.source, _b = _a.description, description = _b === void 0 ? 'Issue reported via gesture interface' : _b;
                console.log("Issue reported via ".concat(source, " at ").concat(timestamp, " by user ").concat((_c = req.user) === null || _c === void 0 ? void 0 : _c.id));
                console.log("Description: ".concat(description));
                res.json({
                    success: true,
                    message: 'Issue reported successfully',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error reporting issue:', error);
                res.status(500).json({ error: 'Failed to report issue' });
            }
            return [2 /*return*/];
        });
    }); });
    // Mark task complete action
    app.post('/api/tasks/complete', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source, taskId;
        var _b;
        return __generator(this, function (_c) {
            try {
                _a = req.body, timestamp = _a.timestamp, source = _a.source, taskId = _a.taskId;
                console.log("Task completion via ".concat(source, " at ").concat(timestamp, " by user ").concat((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                // If taskId is provided, update the specific task
                if (taskId) {
                    // Update job order status or maintenance request
                    // This would depend on your task system implementation
                }
                res.json({
                    success: true,
                    message: 'Task marked as complete',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Error completing task:', error);
                res.status(500).json({ error: 'Failed to complete task' });
            }
            return [2 /*return*/];
        });
    }); });
    // Create quality check action
    app.post('/api/quality-checks', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source, rollId, jobOrderId, qualityCheck, error_2;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    _a = req.body, timestamp = _a.timestamp, source = _a.source, rollId = _a.rollId, jobOrderId = _a.jobOrderId;
                    return [4 /*yield*/, storage_1.storage.createQualityCheck({
                            checkType: 'mobile_gesture',
                            result: 'pending',
                            notes: "Quality check initiated via ".concat(source),
                            rollId: rollId || null,
                            jobOrderId: jobOrderId || null,
                            checkedBy: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || 'unknown'
                        })];
                case 1:
                    qualityCheck = _d.sent();
                    console.log("Quality check created via ".concat(source, " at ").concat(timestamp, " by user ").concat((_c = req.user) === null || _c === void 0 ? void 0 : _c.id));
                    res.json({
                        success: true,
                        message: 'Quality check initiated',
                        checkId: qualityCheck.id,
                        timestamp: new Date().toISOString()
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _d.sent();
                    console.error('Error creating quality check:', error_2);
                    res.status(500).json({ error: 'Failed to create quality check' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Reset machine action
    app.post('/api/machines/reset', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, timestamp, source, machineId, maintenanceAction, error_3;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, , 3]);
                    _a = req.body, timestamp = _a.timestamp, source = _a.source, machineId = _a.machineId;
                    console.log("Machine reset requested via ".concat(source, " at ").concat(timestamp, " by user ").concat((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                    return [4 /*yield*/, storage_1.storage.createMaintenanceAction({
                            requestId: 1, // Default request ID for gesture-based resets
                            actionType: 'reset',
                            description: "Machine reset initiated via ".concat(source),
                            performedBy: ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString()) || 'unknown',
                            status: 'completed',
                            completedAt: new Date()
                        })];
                case 1:
                    maintenanceAction = _e.sent();
                    res.json({
                        success: true,
                        message: 'Machine reset initiated',
                        actionId: maintenanceAction.id,
                        timestamp: new Date().toISOString()
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _e.sent();
                    console.error('Error resetting machine:', error_3);
                    res.status(500).json({ error: 'Failed to reset machine' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get active job orders for mobile
    app.get('/api/job-orders', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, status_1, limit, jobOrders, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = req.query, status_1 = _a.status, limit = _a.limit;
                    return [4 /*yield*/, storage_1.storage.getJobOrders()];
                case 1:
                    jobOrders = _b.sent();
                    if (status_1) {
                        jobOrders = jobOrders.filter(function (job) { return job.status === status_1; });
                    }
                    if (limit) {
                        jobOrders = jobOrders.slice(0, parseInt(limit));
                    }
                    res.json(jobOrders);
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _b.sent();
                    console.error('Error fetching job orders:', error_4);
                    res.status(500).json({ error: 'Failed to fetch job orders' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get quality checks for mobile
    app.get('/api/quality-checks', auth_utils_1.requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var limit, qualityChecks, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    limit = req.query.limit;
                    return [4 /*yield*/, storage_1.storage.getQualityChecks()];
                case 1:
                    qualityChecks = _a.sent();
                    // Sort by most recent first
                    qualityChecks.sort(function (a, b) {
                        var dateA = new Date(a.createdAt || 0);
                        var dateB = new Date(b.createdAt || 0);
                        return dateB.getTime() - dateA.getTime();
                    });
                    if (limit) {
                        qualityChecks = qualityChecks.slice(0, parseInt(limit));
                    }
                    res.json(qualityChecks);
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error('Error fetching quality checks:', error_5);
                    res.status(500).json({ error: 'Failed to fetch quality checks' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
