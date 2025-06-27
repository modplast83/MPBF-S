// Standardized print header for all printed documents
export const generatePrintHeader = () => {
  const companyLogo = `
    <img src="/attached_assets/FactoryLogoHPNGWiqons_1750997252532.png" 
         alt="Modern Plastic Bag Factory Logo" 
         style="width: 80px; height: 80px; object-fit: contain;" />
  `;

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 0; border-bottom: 3px solid #059669; margin-bottom: 30px;">
      <!-- Company Logo -->
      <div style="flex-shrink: 0;">
        ${companyLogo}
      </div>
      
      <!-- Company Name (Bilingual) -->
      <div style="text-align: center; flex-grow: 1;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #065f46; font-family: Arial, sans-serif;">
          Modern Plastic Bag Factory
        </h1>
        <h2 style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #059669; font-family: Arial, sans-serif;" dir="rtl">
          مصنع أكياس البلاستيك الحديث
        </h2>
      </div>
      
      <!-- Spacer for balance -->
      <div style="width: 80px; flex-shrink: 0;"></div>
    </div>
  `;
};

// Generate complete print document with header
export const generatePrintDocument = (title: string, content: string, additionalStyles: string = '') => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            background: white;
          }
          .print-header {
            margin-bottom: 30px;
          }
          .print-content {
            margin-top: 20px;
          }
          .print-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print { 
            body { margin: 0; }
            @page { 
              margin: 0.5in; 
              size: A4;
            }
          }
          ${additionalStyles}
        </style>
      </head>
      <body>
        <div class="print-header">
          ${generatePrintHeader()}
        </div>
        
        <div class="print-content">
          ${content}
        </div>
        
        <div class="print-footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Modern Plastic Bag Factory - Production Management System</p>
        </div>
      </body>
    </html>
  `;
};