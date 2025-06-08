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
exports.SmsService = void 0;
var storage_1 = require("../storage");
// Initialize Taqnyat credentials with environment variables
var taqnyatApiKey = process.env.TAQNYAT_API_KEY;
var taqnyatSenderId = process.env.TAQNYAT_SENDER_ID;
var taqnyatApiUrl = process.env.TAQNYAT_API_URL || 'https://api.taqnyat.sa/v1/messages';
// SMS service class using only Taqnyat
var SmsService = /** @class */ (function () {
    function SmsService() {
    }
    // Check if Taqnyat credentials are available
    SmsService.hasTaqnyatCredentials = function () {
        return !!(taqnyatApiKey && taqnyatSenderId);
    };
    // Send SMS using Taqnyat API
    SmsService.sendTaqnyatMessage = function (to, message) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, errorMsg, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.hasTaqnyatCredentials()) {
                            return [2 /*return*/, { success: false, error: 'Taqnyat credentials not configured' }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        console.log('Attempting to send SMS via Taqnyat...');
                        return [4 /*yield*/, fetch(taqnyatApiUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': "Bearer ".concat(taqnyatApiKey)
                                },
                                body: JSON.stringify({
                                    body: message,
                                    recipients: [to],
                                    sender: taqnyatSenderId
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (response.ok && result.statusCode === 201) {
                            console.log('SMS sent successfully via Taqnyat');
                            return [2 /*return*/, {
                                    success: true,
                                    messageId: result.messageId || result.id || 'taq_' + Date.now()
                                }];
                        }
                        else {
                            errorMsg = result.message || "HTTP ".concat(response.status, ": ").concat(response.statusText);
                            console.log("Taqnyat failed: ".concat(errorMsg));
                            return [2 /*return*/, {
                                    success: false,
                                    error: errorMsg
                                }];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Failed to send SMS via Taqnyat:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message || 'Network error connecting to Taqnyat'
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Send a message and record it in the database
    SmsService.sendMessage = function (messageData) {
        return __awaiter(this, void 0, void 0, function () {
            var message, result, updatedMessage, updatedMessage, error_2, updatedMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage_1.storage.createSmsMessage(__assign(__assign({}, messageData), { status: 'pending', twilioMessageId: null }))];
                    case 1:
                        message = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        return [4 /*yield*/, this.sendTaqnyatMessage(messageData.recipientPhone, messageData.message)];
                    case 3:
                        result = _a.sent();
                        if (!result.success) return [3 /*break*/, 5];
                        return [4 /*yield*/, storage_1.storage.updateSmsMessage(message.id, {
                                status: 'sent',
                                twilioMessageId: result.messageId || null,
                                errorMessage: 'Sent via Taqnyat'
                            })];
                    case 4:
                        updatedMessage = _a.sent();
                        return [2 /*return*/, updatedMessage];
                    case 5: return [4 /*yield*/, storage_1.storage.updateSmsMessage(message.id, {
                            status: 'failed',
                            errorMessage: result.error || 'Failed to send SMS via Taqnyat'
                        })];
                    case 6:
                        updatedMessage = _a.sent();
                        return [2 /*return*/, updatedMessage];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        error_2 = _a.sent();
                        // Handle unexpected errors and update the message status
                        console.error('Unexpected error sending SMS:', error_2);
                        return [4 /*yield*/, storage_1.storage.updateSmsMessage(message.id, {
                                status: 'failed',
                                errorMessage: error_2.message || 'Unexpected error sending SMS'
                            })];
                    case 9:
                        updatedMessage = _a.sent();
                        return [2 /*return*/, updatedMessage];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    // Send order notification
    SmsService.sendOrderNotification = function (orderId, recipientPhone, message, sentBy, recipientName, customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendMessage({
                        recipientPhone: recipientPhone,
                        message: message,
                        messageType: 'order_notification',
                        orderId: orderId,
                        customerId: customerId,
                        recipientName: recipientName,
                        sentBy: sentBy,
                        jobOrderId: null,
                        category: 'order',
                        priority: 'normal',
                        scheduledFor: null,
                        deliveredAt: null,
                        errorMessage: null
                    })];
            });
        });
    };
    // Send job order status update
    SmsService.sendJobOrderUpdate = function (jobOrderId, recipientPhone, message, sentBy, recipientName, customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendMessage({
                        recipientPhone: recipientPhone,
                        message: message,
                        messageType: 'status_update',
                        jobOrderId: jobOrderId,
                        customerId: customerId,
                        recipientName: recipientName,
                        sentBy: sentBy,
                        orderId: null,
                        category: 'status',
                        priority: 'normal',
                        scheduledFor: null,
                        deliveredAt: null,
                        errorMessage: null
                    })];
            });
        });
    };
    // Send custom message
    SmsService.sendCustomMessage = function (recipientPhone_1, message_1, sentBy_1, recipientName_1) {
        return __awaiter(this, arguments, void 0, function (recipientPhone, message, sentBy, recipientName, category, priority, customerId, orderId, jobOrderId) {
            if (category === void 0) { category = 'general'; }
            if (priority === void 0) { priority = 'normal'; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendMessage({
                        recipientPhone: recipientPhone,
                        message: message,
                        messageType: 'custom',
                        category: category,
                        priority: priority,
                        customerId: customerId,
                        recipientName: recipientName,
                        sentBy: sentBy,
                        orderId: orderId,
                        jobOrderId: jobOrderId,
                        scheduledFor: null,
                        deliveredAt: null,
                        errorMessage: null
                    })];
            });
        });
    };
    // Check if service is available
    SmsService.isAvailable = function () {
        return this.hasTaqnyatCredentials();
    };
    // Get service status
    SmsService.getStatus = function () {
        if (this.hasTaqnyatCredentials()) {
            return { available: true, provider: 'Taqnyat' };
        }
        else {
            return {
                available: false,
                provider: 'Taqnyat',
                error: 'Taqnyat credentials not configured'
            };
        }
    };
    return SmsService;
}());
exports.SmsService = SmsService;
