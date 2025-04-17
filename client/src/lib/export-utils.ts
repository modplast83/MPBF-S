/**
 * Utilities for exporting and downloading CSV templates
 */

/**
 * Generate a CSV string from a template definition
 * @param headers Array of header names
 * @param sampleData Optional array of sample data rows
 * @returns CSV string
 */
export function generateCSV(headers: string[], sampleData?: any[][]): string {
  // Create the headers row
  let csv = headers.join(',') + '\n';
  
  // Add sample data if provided
  if (sampleData && sampleData.length > 0) {
    sampleData.forEach(row => {
      csv += row.join(',') + '\n';
    });
  } else {
    // Add an empty row as placeholder
    csv += headers.map(() => '').join(',') + '\n';
  }
  
  return csv;
}

/**
 * Download a string as a file
 * @param content Content string
 * @param fileName File name
 * @param mimeType MIME type
 */
export function downloadFile(content: string, fileName: string, mimeType: string = 'text/csv') {
  // Create a blob
  const blob = new Blob([content], { type: mimeType });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Template definitions for each entity type
 */
export const templateDefinitions = {
  categories: {
    headers: ['id', 'name', 'code'],
    sampleData: [
      ['CAT001', 'Sample Category', 'SC'],
    ],
    fileName: 'categories_template.csv',
  },
  customers: {
    headers: ['id', 'code', 'name', 'nameAr', 'userId', 'plateDrawerCode'],
    sampleData: [
      ['CUST001', 'CUS1', 'Sample Customer', '', '', 'A-01'],
    ],
    fileName: 'customers_template.csv',
  },
  items: {
    headers: ['id', 'categoryId', 'name', 'fullName'],
    sampleData: [
      ['ITM001', 'CAT001', 'Sample Item', 'Sample Full Item Name'],
    ],
    fileName: 'items_template.csv',
  },
  customerProducts: {
    headers: [
      'customerId', 'categoryId', 'itemId', 'sizeCaption', 'width', 'leftF', 
      'rightF', 'thickness', 'thicknessOne', 'printingCylinder', 'lengthCm', 
      'cuttingLength', 'rawMaterial', 'masterBatchId', 'printed', 'cuttingUnit', 
      'unitWeight', 'packing', 'punching', 'cover', 'volum', 'knife', 'notes'
    ],
    sampleData: [
      [
        'CUST001', 'CAT001', 'ITM001', '10×10+35', '10', '10', '35', '12', '12', 
        '0', '0', '0', 'HDPE', 'MB001', '/', 'Kg', '1.2', '20K/Bag', 'None', '-', '', '', ''
      ],
    ],
    fileName: 'customer_products_template.csv',
  },
  sections: {
    headers: ['id', 'name'],
    sampleData: [
      ['SEC001', 'Extrusion'],
    ],
    fileName: 'sections_template.csv',
  },
  machines: {
    headers: ['id', 'name', 'sectionId', 'isActive'],
    sampleData: [
      ['MCH001', 'Extruder 1', 'SEC001', 'true'],
    ],
    fileName: 'machines_template.csv',
  },
  masterBatches: {
    headers: ['id', 'name'],
    sampleData: [
      ['MB001', 'White EP11105W'],
    ],
    fileName: 'master_batches_template.csv',
  },
  rawMaterials: {
    headers: ['name', 'type', 'quantity', 'unit'],
    sampleData: [
      ['HDPE', 'Plastic', '1000', 'Kg'],
    ],
    fileName: 'raw_materials_template.csv',
  },
  users: {
    headers: ['username', 'password', 'name', 'role', 'isActive', 'sectionId'],
    sampleData: [
      ['user1', 'password123', 'John Doe', 'operator', 'true', 'SEC001'],
    ],
    fileName: 'users_template.csv',
  },
};