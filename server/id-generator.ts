// Utility functions to generate serial IDs for orders and job orders

/**
 * Generates order ID in format O001, O002, etc.
 * @param orderNumber - The numeric order number
 * @returns Formatted order ID
 */
export function generateOrderId(orderNumber: number): string {
  return `O${orderNumber.toString().padStart(3, '0')}`;
}

/**
 * Generates job order ID in format O001-JO01, O001-JO02, etc.
 * @param orderId - The order ID (e.g., "O001")
 * @param jobOrderSequence - The sequence number for this job order within the order
 * @returns Formatted job order ID
 */
export function generateJobOrderId(orderId: string, jobOrderSequence: number): string {
  return `${orderId}-JO${jobOrderSequence.toString().padStart(2, '0')}`;
}

/**
 * Extracts the numeric order number from an order ID
 * @param orderId - The order ID (e.g., "O001")
 * @returns The numeric order number
 */
export function extractOrderNumber(orderId: string): number {
  const match = orderId.match(/^O(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts the order ID and sequence number from a job order ID
 * @param jobOrderId - The job order ID (e.g., "O001-JO01")
 * @returns Object with orderId and sequence number
 */
export function extractJobOrderInfo(jobOrderId: string): { orderId: string; sequence: number } {
  const match = jobOrderId.match(/^(O\d+)-JO(\d+)$/);
  return match 
    ? { orderId: match[1], sequence: parseInt(match[2], 10) }
    : { orderId: '', sequence: 0 };
}