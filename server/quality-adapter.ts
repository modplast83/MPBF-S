/**
 * This adapter transforms the database quality check types structure
 * to match what the frontend expects
 */

interface DatabaseQualityCheckType {
  id: string;
  name: string;
  description: string | null;
  stage: string;
  target_stage?: string;
  type: string;
  category: string;
  is_active: boolean;
  checklist_items?: string[];
  parameters?: string[];
}

interface FrontendQualityCheckType {
  id: string;
  name: string;
  description: string | null;
  targetStage: string;
  checklistItems: string[];
  parameters: string[];
  isActive: boolean;
}

/**
 * Transforms database quality check type to frontend expected format
 */
export function adaptToFrontend(dbCheckType: DatabaseQualityCheckType): FrontendQualityCheckType {
  return {
    id: dbCheckType.id,
    name: dbCheckType.name,
    description: dbCheckType.description,
    targetStage: dbCheckType.target_stage || dbCheckType.stage || 'extrusion',
    checklistItems: dbCheckType.checklist_items || [],
    parameters: dbCheckType.parameters || [],
    isActive: dbCheckType.is_active
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
    stage: 'production', // Default stage
    target_stage: frontendCheckType.targetStage,
    type: 'standard', // Default type
    category: 'physical', // Default category
    is_active: frontendCheckType.isActive,
    checklist_items: frontendCheckType.checklistItems,
    parameters: frontendCheckType.parameters
  };
}