// Utility functions to format order and job order IDs for display

/**
 * Formats order ID for display in format O001, O002, etc.
 * @param orderId - The numeric order ID
 * @returns Formatted order ID for display
 */
export function formatOrderId(orderId: number): string {
  return `O${orderId.toString().padStart(3, '0')}`;
}

/**
 * Formats job order ID for display in format O001-JO01, O001-JO02, etc.
 * @param orderId - The numeric order ID
 * @param jobOrderId - The numeric job order ID
 * @returns Formatted job order ID for display
 */
export function formatJobOrderId(orderId: number, jobOrderId: number): string {
  const orderSerial = formatOrderId(orderId);
  const jobSerial = jobOrderId.toString().padStart(2, '0');
  return `${orderSerial}-JO${jobSerial}`;
}

/**
 * Gets the job order sequence number within an order
 * @param allJobOrders - Array of all job orders
 * @param orderId - The order ID
 * @param currentJobOrderId - The current job order ID
 * @returns The sequence number (1, 2, 3, etc.)
 */
export function getJobOrderSequence(allJobOrders: any[], orderId: number, currentJobOrderId: number): number {
  const orderJobOrders = allJobOrders
    .filter(jo => jo.orderId === orderId)
    .sort((a, b) => a.id - b.id);
  
  return orderJobOrders.findIndex(jo => jo.id === currentJobOrderId) + 1;
}