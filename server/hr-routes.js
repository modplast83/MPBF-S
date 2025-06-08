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
exports.setupHRRoutes = setupHRRoutes;
var hr_storage_1 = require("./hr-storage");
function setupHRRoutes(app) {
    var _this = this;
    // Time Attendance endpoints
    app.get("/api/hr/time-attendance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var attendance, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.getTimeAttendance()];
                case 1:
                    attendance = _a.sent();
                    res.json(attendance);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching attendance:", error_1);
                    res.status(500).json({ error: "Failed to fetch attendance records" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hr/time-attendance", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var attendance, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.createTimeAttendance(req.body)];
                case 1:
                    attendance = _a.sent();
                    res.json(attendance);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error creating attendance:", error_2);
                    res.status(500).json({ error: "Failed to create attendance record" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.put("/api/hr/time-attendance/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var id, attendance, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    id = parseInt(req.params.id);
                    if (isNaN(id)) {
                        return [2 /*return*/, res.status(400).json({ error: "Invalid attendance ID" })];
                    }
                    return [4 /*yield*/, hr_storage_1.hrStorage.updateTimeAttendance(id, req.body)];
                case 1:
                    attendance = _a.sent();
                    if (!attendance) {
                        return [2 /*return*/, res.status(404).json({ error: "Attendance record not found" })];
                    }
                    res.json(attendance);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error updating attendance:", error_3);
                    res.status(500).json({ error: "Failed to update attendance record" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Employee of Month endpoints
    app.get("/api/hr/employee-of-month", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var employees, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.getEmployeeOfMonth()];
                case 1:
                    employees = _a.sent();
                    res.json(employees);
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error("Error fetching employee of month:", error_4);
                    res.status(500).json({ error: "Failed to fetch employee records" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hr/employee-of-month", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var employee, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.createEmployeeOfMonth(req.body)];
                case 1:
                    employee = _a.sent();
                    res.json(employee);
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error("Error creating employee of month:", error_5);
                    res.status(500).json({ error: "Failed to create employee record" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // HR Violations endpoints
    app.get("/api/hr/violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var violations, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.getHrViolations()];
                case 1:
                    violations = _a.sent();
                    res.json(violations);
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error("Error fetching violations:", error_6);
                    res.status(500).json({ error: "Failed to fetch violation records" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hr/violations", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var violation, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.createHrViolation(req.body)];
                case 1:
                    violation = _a.sent();
                    res.json(violation);
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error creating violation:", error_7);
                    res.status(500).json({ error: "Failed to create violation record" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // HR Complaints endpoints
    app.get("/api/hr/complaints", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var complaints, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.getHrComplaints()];
                case 1:
                    complaints = _a.sent();
                    res.json(complaints);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error fetching complaints:", error_8);
                    res.status(500).json({ error: "Failed to fetch complaint records" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hr/complaints", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var complaint, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.createHrComplaint(req.body)];
                case 1:
                    complaint = _a.sent();
                    res.json(complaint);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.error("Error creating complaint:", error_9);
                    res.status(500).json({ error: "Failed to create complaint record" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Users endpoint for HR module
    app.get("/api/hr/users", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var users, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, hr_storage_1.hrStorage.getUsers()];
                case 1:
                    users = _a.sent();
                    res.json(users);
                    return [3 /*break*/, 3];
                case 2:
                    error_10 = _a.sent();
                    console.error("Error fetching users:", error_10);
                    res.status(500).json({ error: "Failed to fetch users" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
