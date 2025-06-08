"use strict";
/**
 * This adapter transforms the database quality check types structure
 * to match what the frontend expects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptToFrontend = adaptToFrontend;
exports.adaptToDatabase = adaptToDatabase;
/**
 * Transforms database quality check type to frontend expected format
 */
function adaptToFrontend(dbCheckType) {
    return {
        id: dbCheckType.id,
        name: dbCheckType.name,
        description: dbCheckType.description,
        targetStage: dbCheckType.targetStage,
        checklistItems: dbCheckType.checklistItems,
        parameters: dbCheckType.parameters,
        isActive: dbCheckType.isActive
    };
}
/**
 * Transforms frontend quality check type to database format
 */
function adaptToDatabase(frontendCheckType) {
    return {
        id: frontendCheckType.id,
        name: frontendCheckType.name,
        description: frontendCheckType.description,
        targetStage: frontendCheckType.targetStage,
        checklistItems: frontendCheckType.checklistItems,
        parameters: frontendCheckType.parameters,
        isActive: frontendCheckType.isActive
    };
}
