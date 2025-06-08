"use strict";
/**
 * This adapter transforms the quality check data between frontend and database formats
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptToFrontend = adaptToFrontend;
exports.adaptToDatabase = adaptToDatabase;
/**
 * Transforms database quality check to frontend expected format
 */
function adaptToFrontend(dbCheck) {
    return {
        id: dbCheck.id,
        checkTypeId: dbCheck.check_type_id,
        performedBy: dbCheck.checked_by,
        jobOrderId: dbCheck.job_order_id,
        rollId: dbCheck.roll_id,
        status: dbCheck.status,
        notes: dbCheck.notes,
        timestamp: dbCheck.checked_at || dbCheck.created_at,
        checklistResults: dbCheck.checklist_results || [],
        parameterValues: dbCheck.parameter_values || [],
        issueSeverity: dbCheck.issue_severity,
        imageUrls: dbCheck.image_urls || []
    };
}
/**
 * Transforms frontend quality check to database format
 */
function adaptToDatabase(frontendCheck) {
    var dbCheck = {
        check_type_id: frontendCheck.checkTypeId,
        checked_by: frontendCheck.performedBy,
        job_order_id: frontendCheck.jobOrderId,
        roll_id: frontendCheck.rollId,
        status: frontendCheck.status,
        notes: frontendCheck.notes,
    };
    if (frontendCheck.checklistResults) {
        dbCheck.checklist_results = frontendCheck.checklistResults;
    }
    if (frontendCheck.parameterValues) {
        dbCheck.parameter_values = frontendCheck.parameterValues;
    }
    if (frontendCheck.issueSeverity) {
        dbCheck.issue_severity = frontendCheck.issueSeverity;
    }
    if (frontendCheck.imageUrls) {
        dbCheck.image_urls = frontendCheck.imageUrls;
    }
    return dbCheck;
}
