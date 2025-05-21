import { CollapsibleJobOrdersForExtrusion } from "./collapsible-job-orders";

// This is a wrapper component to maintain backward compatibility
export function JobOrdersForExtrusion() {
  return <CollapsibleJobOrdersForExtrusion />;
}

// Re-export the new component
export { CollapsibleJobOrdersForExtrusion as GroupedJobOrdersForExtrusion };