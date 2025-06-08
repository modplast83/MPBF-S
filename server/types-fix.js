"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseValidatedData = parseValidatedData;
exports.safeAccess = safeAccess;
exports.validateRequest = validateRequest;
exports.castValidated = castValidated;
exports.assertType = assertType;
// Type assertion helpers for validated data
function parseValidatedData(schema, data) {
    return schema.parse(data);
}
function safeAccess(obj, property) {
    return obj === null || obj === void 0 ? void 0 : obj[property];
}
// Generic validation wrapper that properly types the result
function validateRequest(schema, body) {
    try {
        var result = schema.parse(body);
        return result;
    }
    catch (error) {
        throw new Error("Validation failed: ".concat(error));
    }
}
// Safe type casting for request bodies
function castValidated(validatedData) {
    return validatedData;
}
// Type assertion for any object
function assertType(obj) {
    return obj;
}
