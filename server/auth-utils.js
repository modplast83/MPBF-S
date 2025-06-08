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
exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;
exports.requireAuth = requireAuth;
var crypto_1 = require("crypto");
var util_1 = require("util");
var scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, buf;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    salt = (0, crypto_1.randomBytes)(16).toString("hex");
                    return [4 /*yield*/, scryptAsync(password, salt, 64)];
                case 1:
                    buf = (_a.sent());
                    return [2 /*return*/, "".concat(buf.toString("hex"), ".").concat(salt)];
            }
        });
    });
}
function comparePasswords(supplied, stored) {
    return __awaiter(this, void 0, void 0, function () {
        var parts, hashed, salt, hashedBuf, suppliedBuf, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!supplied || !stored) {
                        console.log("Password comparison failed: empty password provided");
                        return [2 /*return*/, false];
                    }
                    // Check if stored password is in the expected format (has a salt)
                    if (!stored.includes('.')) {
                        console.log("Password in legacy format (no salt), performing direct comparison");
                        // For compatibility with initial setup or unencrypted passwords
                        // Simply compare the raw passwords as a fallback
                        return [2 /*return*/, supplied === stored];
                    }
                    parts = stored.split(".");
                    if (parts.length !== 2) {
                        console.log("Password in invalid format: expected 2 parts but got ".concat(parts.length));
                        return [2 /*return*/, false];
                    }
                    hashed = parts[0], salt = parts[1];
                    if (!hashed || !salt) {
                        console.log("Password malformed: missing hash or salt component");
                        return [2 /*return*/, false];
                    }
                    hashedBuf = Buffer.from(hashed, "hex");
                    return [4 /*yield*/, scryptAsync(supplied, salt, 64)];
                case 1:
                    suppliedBuf = (_a.sent());
                    if (hashedBuf.length !== suppliedBuf.length) {
                        console.log("Buffer length mismatch: stored=".concat(hashedBuf.length, ", supplied=").concat(suppliedBuf.length));
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, (0, crypto_1.timingSafeEqual)(hashedBuf, suppliedBuf)];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error during password comparison:", error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Authentication middleware
function requireAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Authentication required' });
}
