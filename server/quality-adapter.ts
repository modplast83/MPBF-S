/**
 * This adapter transforms the database quality check types structure
 * to match what the frontend expects
 */

interface DatabaseQualityCheckType {
  id: string;
  name: string;
  description: string | null;
  checklistItems: string[] | null;
  parameters: string[] | null;
  targetStage: string;
  isActive: boolean | null;
}

interface FrontendQualityCheckType {
  id: string;
  name: string;
  description: string | null;
  targetStage: string;
  checklistItems: string[] | null;
  parameters: string[] | null;
  isActive: boolean | null;
}

/**
 * Transforms database quality check type to frontend expected format
 */
export function adaptToFrontend(dbCheckType: DatabaseQualityCheckType): FrontendQualityCheckType {
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
export function adaptToDatabase(frontendCheckType: FrontendQualityCheckType): DatabaseQualityCheckType {
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