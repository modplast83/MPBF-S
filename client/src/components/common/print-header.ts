// Standardized print header for all printed documents
export const generatePrintHeader = () => {
  const logoSvg = `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#059669" stroke="#065f46" stroke-width="2"/>
      <path d="M25 30h30v20H25z" fill="white" opacity="0.9"/>
      <path d="M30 35h20v2H30zM30 40h20v2H30zM30 45h15v2H30z" fill="#065f46"/>
      <circle cx="40" cy="25" r="8" fill="#34d399" opacity="0.8"/>
      <path d="M35 25h10v2H35z" fill="#065f46"/>
      <text x="40" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#065f46">MPBF</text>
    </svg>
  `;

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 0; border-bottom: 3px solid #059669; margin-bottom: 30px;">
      <!-- Company Logo -->
      <div style="flex-shrink: 0;">
        ${logoSvg}
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