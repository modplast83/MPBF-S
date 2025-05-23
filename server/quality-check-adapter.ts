/**
 * This adapter transforms the quality check data between frontend and database formats
 */

// Interface for quality check data as stored in the database
export interface DatabaseQualityCheck {
  id: number;
  check_type_id: string;
  checked_by: string | null;
  job_order_id: number | null;
  roll_id: string | null;
  status: string;
  notes: string | null;
  checked_at: Date;
  created_at: Date;
  checklist_results?: string[] | null;
  parameter_values?: string[] | null;
  issue_severity?: string | null;
  image_urls?: string[] | null;
}

// Interface for quality check data as used in the frontend
export interface FrontendQualityCheck {
  id: number;
  checkTypeId: string;
  performedBy: string | null;
  jobOrderId: number | null;
  rollId: string | null;
  status: string;
  notes: string | null;
  timestamp: Date;
  checklistResults: string[] | null;
  parameterValues: string[] | null;
  issueSeverity: string | null;
  imageUrls: string[] | null;
}

/**
 * Transforms database quality check to frontend expected format
 */
export function adaptToFrontend(dbCheck: DatabaseQualityCheck): FrontendQualityCheck {
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
    issueSeverity: dbCheck.issue_severity || null,
    imageUrls: dbCheck.image_urls || []
  };
}

/**
 * Transforms frontend quality check to database format
 */
export function adaptToDatabase(frontendCheck: Partial<FrontendQualityCheck>): Partial<DatabaseQualityCheck> {
  const dbCheck: Partial<DatabaseQualityCheck> = {
    check_type_id: frontendCheck.checkTypeId,
    checked_by: frontendCheck.performedBy,
    job_order_id: frontendCheck.jobOrderId || null,
    roll_id: frontendCheck.rollId || null,
    status: frontendCheck.status,
    notes: frontendCheck.notes || null,
  };

  // Initialize arrays with empty arrays even if they're undefined
  dbCheck.checklist_results = frontendCheck.checklistResults || [];
  dbCheck.parameter_values = frontendCheck.parameterValues || [];
  dbCheck.image_urls = frontendCheck.imageUrls || [];
  
  // Only set issue_severity if it exists
  if (frontendCheck.issueSeverity) {
    dbCheck.issue_severity = frontendCheck.issueSeverity;
  } else {
    dbCheck.issue_severity = null;
  }
  
  return dbCheck;
}