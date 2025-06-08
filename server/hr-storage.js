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
exports.hrStorage = exports.HRStorage = void 0;
// Temporary in-memory storage for HR module to bypass database issues
var HRStorage = /** @class */ (function () {
    function HRStorage() {
        this.timeAttendance = [];
        this.employeeOfMonth = [];
        this.hrViolations = [];
        this.hrComplaints = [];
        this.currentId = 1;
    }
    // Time Attendance methods
    HRStorage.prototype.getTimeAttendance = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.timeAttendance];
            });
        });
    };
    HRStorage.prototype.getTimeAttendanceByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.timeAttendance.filter(function (att) { return att.userId === userId; })];
            });
        });
    };
    HRStorage.prototype.getTimeAttendanceByDate = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var dateStr;
            return __generator(this, function (_a) {
                dateStr = date.toISOString().split('T')[0];
                return [2 /*return*/, this.timeAttendance.filter(function (att) {
                        var attDate = new Date(att.date).toISOString().split('T')[0];
                        return attDate === dateStr;
                    })];
            });
        });
    };
    HRStorage.prototype.getTimeAttendanceByUserAndDate = function (userId, date) {
        return __awaiter(this, void 0, void 0, function () {
            var dateStr;
            return __generator(this, function (_a) {
                dateStr = date.toISOString().split('T')[0];
                return [2 /*return*/, this.timeAttendance.find(function (att) {
                        var attDate = new Date(att.date).toISOString().split('T')[0];
                        return att.userId === userId && attDate === dateStr;
                    })];
            });
        });
    };
    HRStorage.prototype.createTimeAttendance = function (attendance) {
        return __awaiter(this, void 0, void 0, function () {
            var newAttendance;
            return __generator(this, function (_a) {
                newAttendance = __assign(__assign({}, attendance), { id: this.currentId++ });
                this.timeAttendance.push(newAttendance);
                return [2 /*return*/, newAttendance];
            });
        });
    };
    HRStorage.prototype.updateTimeAttendance = function (id, attendance) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.timeAttendance.findIndex(function (att) { return att.id === id; });
                if (index !== -1) {
                    this.timeAttendance[index] = __assign(__assign({}, this.timeAttendance[index]), attendance);
                    return [2 /*return*/, this.timeAttendance[index]];
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    HRStorage.prototype.deleteTimeAttendance = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.timeAttendance.findIndex(function (att) { return att.id === id; });
                if (index !== -1) {
                    this.timeAttendance.splice(index, 1);
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    // Employee of Month methods
    HRStorage.prototype.getEmployeeOfMonth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.employeeOfMonth];
            });
        });
    };
    HRStorage.prototype.getEmployeeOfMonthByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.employeeOfMonth.filter(function (emp) { return emp.user_id === userId; })];
            });
        });
    };
    HRStorage.prototype.createEmployeeOfMonth = function (employee) {
        return __awaiter(this, void 0, void 0, function () {
            var newEmployee;
            return __generator(this, function (_a) {
                newEmployee = __assign(__assign({}, employee), { id: this.currentId++ });
                this.employeeOfMonth.push(newEmployee);
                return [2 /*return*/, newEmployee];
            });
        });
    };
    HRStorage.prototype.updateEmployeeOfMonth = function (id, employee) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.employeeOfMonth.findIndex(function (emp) { return emp.id === id; });
                if (index !== -1) {
                    this.employeeOfMonth[index] = __assign(__assign({}, this.employeeOfMonth[index]), employee);
                    return [2 /*return*/, this.employeeOfMonth[index]];
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    HRStorage.prototype.deleteEmployeeOfMonth = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.employeeOfMonth.findIndex(function (emp) { return emp.id === id; });
                if (index !== -1) {
                    this.employeeOfMonth.splice(index, 1);
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    // HR Violations methods
    HRStorage.prototype.getHrViolations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hrViolations];
            });
        });
    };
    HRStorage.prototype.getHrViolationsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hrViolations.filter(function (viol) { return viol.user_id === userId; })];
            });
        });
    };
    HRStorage.prototype.createHrViolation = function (violation) {
        return __awaiter(this, void 0, void 0, function () {
            var newViolation;
            return __generator(this, function (_a) {
                newViolation = __assign(__assign({}, violation), { id: this.currentId++ });
                this.hrViolations.push(newViolation);
                return [2 /*return*/, newViolation];
            });
        });
    };
    HRStorage.prototype.updateHrViolation = function (id, violation) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.hrViolations.findIndex(function (viol) { return viol.id === id; });
                if (index !== -1) {
                    this.hrViolations[index] = __assign(__assign({}, this.hrViolations[index]), violation);
                    return [2 /*return*/, this.hrViolations[index]];
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    HRStorage.prototype.deleteHrViolation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.hrViolations.findIndex(function (viol) { return viol.id === id; });
                if (index !== -1) {
                    this.hrViolations.splice(index, 1);
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    // HR Complaints methods
    HRStorage.prototype.getHrComplaints = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hrComplaints];
            });
        });
    };
    HRStorage.prototype.getHrComplaintsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hrComplaints.filter(function (comp) { return comp.complainant_id === userId; })];
            });
        });
    };
    HRStorage.prototype.createHrComplaint = function (complaint) {
        return __awaiter(this, void 0, void 0, function () {
            var newComplaint;
            return __generator(this, function (_a) {
                newComplaint = __assign(__assign({}, complaint), { id: this.currentId++ });
                this.hrComplaints.push(newComplaint);
                return [2 /*return*/, newComplaint];
            });
        });
    };
    HRStorage.prototype.updateHrComplaint = function (id, complaint) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.hrComplaints.findIndex(function (comp) { return comp.id === id; });
                if (index !== -1) {
                    this.hrComplaints[index] = __assign(__assign({}, this.hrComplaints[index]), complaint);
                    return [2 /*return*/, this.hrComplaints[index]];
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    HRStorage.prototype.deleteHrComplaint = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                index = this.hrComplaints.findIndex(function (comp) { return comp.id === id; });
                if (index !== -1) {
                    this.hrComplaints.splice(index, 1);
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            });
        });
    };
    // Get mock users for testing
    HRStorage.prototype.getUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        { id: 1, name: "Ahmed Hassan", username: "ahmed", department: "Production", position: "Manager" },
                        { id: 2, name: "Fatima Al-Zahra", username: "fatima", department: "Quality", position: "Inspector" },
                        { id: 3, name: "Omar Mahmoud", username: "omar", department: "Maintenance", position: "Technician" },
                        { id: 4, name: "Layla Ibrahim", username: "layla", department: "HR", position: "Coordinator" },
                        { id: 5, name: "Youssef Ahmed", username: "youssef", department: "Production", position: "Operator" }
                    ]];
            });
        });
    };
    return HRStorage;
}());
exports.HRStorage = HRStorage;
exports.hrStorage = new HRStorage();
