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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
var passport_1 = require("passport");
var passport_local_1 = require("passport-local");
var express_session_1 = require("express-session");
var storage_1 = require("./storage");
var auth_utils_1 = require("./auth-utils");
var crypto_1 = require("crypto");
function setupAuth(app) {
    var _this = this;
    var sessionSettings = {
        secret: process.env.SESSION_SECRET || 'mpbf_session_secret',
        resave: true,
        saveUninitialized: true,
        store: storage_1.storage.sessionStore,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            httpOnly: true,
            sameSite: 'lax',
            path: '/'
        }
    };
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy(function (username, password, done) { return __awaiter(_this, void 0, void 0, function () {
        var user, isPasswordValid, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, storage_1.storage.getUserByUsername(username)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, done(null, false, { message: "Incorrect username" })];
                    }
                    return [4 /*yield*/, (0, auth_utils_1.comparePasswords)(password, user.password || "")];
                case 2:
                    isPasswordValid = _a.sent();
                    if (!isPasswordValid) {
                        return [2 /*return*/, done(null, false, { message: "Incorrect password" })];
                    }
                    return [2 /*return*/, done(null, {
                            id: user.id,
                            username: user.username,
                            isAdmin: user.isAdmin || false,
                            sectionId: user.sectionId || undefined,
                            email: user.email || undefined,
                            firstName: user.firstName || undefined,
                            lastName: user.lastName || undefined
                        })];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, done(error_1)];
                case 4: return [2 /*return*/];
            }
        });
    }); }));
    passport_1.default.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(function (id, done) { return __awaiter(_this, void 0, void 0, function () {
        var user, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage_1.storage.getUser(id)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, done(null, false)];
                    }
                    done(null, {
                        id: user.id,
                        username: user.username,
                        isAdmin: user.isAdmin || false,
                        sectionId: user.sectionId || undefined,
                        email: user.email || undefined,
                        firstName: user.firstName || undefined,
                        lastName: user.lastName || undefined
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    done(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Registration endpoint
    app.post("/api/register", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, username, password, email, firstName, lastName, existingUser, hashedPassword, newUser, _, userWithoutPassword_1, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    _a = req.body, username = _a.username, password = _a.password, email = _a.email, firstName = _a.firstName, lastName = _a.lastName;
                    return [4 /*yield*/, storage_1.storage.getUserByUsername(username)];
                case 1:
                    existingUser = _b.sent();
                    if (existingUser) {
                        return [2 /*return*/, res.status(400).json({ message: "Username already exists" })];
                    }
                    return [4 /*yield*/, (0, auth_utils_1.hashPassword)(password)];
                case 2:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, storage_1.storage.createUser({
                            id: crypto_1.default.randomUUID(),
                            username: username,
                            password: hashedPassword,
                            email: email,
                            firstName: firstName,
                            lastName: lastName,
                            isAdmin: false,
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })];
                case 3:
                    newUser = _b.sent();
                    _ = newUser.password, userWithoutPassword_1 = __rest(newUser, ["password"]);
                    // Log in the user
                    req.login(newUser, function (err) {
                        if (err) {
                            return res.status(500).json({ message: "Login failed after registration" });
                        }
                        return res.status(201).json(userWithoutPassword_1);
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _b.sent();
                    console.error("Registration error:", error_3);
                    res.status(500).json({ message: error_3.message || "Registration failed" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Login endpoint
    app.post("/api/login", function (req, res, next) {
        console.log("Login attempt for user:", req.body.username);
        passport_1.default.authenticate("local", function (err, user, info) {
            if (err) {
                console.error("Login error:", err);
                return next(err);
            }
            if (!user) {
                console.log("Authentication failed:", info === null || info === void 0 ? void 0 : info.message);
                return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || "Authentication failed" });
            }
            req.login(user, function (err) {
                if (err) {
                    console.error("Login session error:", err);
                    return next(err);
                }
                console.log("User logged in successfully:", user.username);
                // Return user without password
                var _ = user.password, userWithoutPassword = __rest(user, ["password"]);
                // Set a cache control header to prevent caching
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('Surrogate-Control', 'no-store');
                // Send the response
                return res.status(200).json(userWithoutPassword);
            });
        })(req, res, next);
    });
    // Logout endpoint
    app.post("/api/logout", function (req, res) {
        var _a;
        console.log("Logout request received");
        if (!req.isAuthenticated()) {
            console.log("Logout attempted for non-authenticated session");
            return res.status(200).json({ message: "No session to log out" });
        }
        var username = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.username) || 'unknown';
        console.log("Logging out user: ".concat(username));
        req.logout(function (err) {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ message: "Logout failed" });
            }
            // Explicitly destroy the session
            if (req.session) {
                req.session.destroy(function (err) {
                    if (err) {
                        console.error("Session destruction error:", err);
                        return res.status(500).json({ message: "Error destroying session" });
                    }
                    // Clear the session cookie
                    res.clearCookie('connect.sid', {
                        path: '/',
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    });
                    console.log("User ".concat(username, " logged out successfully"));
                    return res.status(200).json({ message: "Logged out successfully" });
                });
            }
            else {
                console.log("User ".concat(username, " logged out successfully (no session to destroy)"));
                return res.status(200).json({ message: "Logged out successfully" });
            }
        });
    });
    // Get current user endpoint
    app.get("/api/user", function (req, res) {
        var _a;
        // Set cache control headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        if (!req.isAuthenticated()) {
            console.log("Attempt to get user data with unauthenticated session");
            return res.status(401).json({ message: "Not authenticated" });
        }
        var username = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.username) || 'unknown';
        console.log("Getting user data for: ".concat(username));
        // Return user without password
        var _b = req.user, _ = _b.password, userWithoutPassword = __rest(_b, ["password"]);
        // Send the response
        return res.status(200).json(userWithoutPassword);
    });
}
