import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  showHeader?: boolean;
  showFooter?: boolean;
  includeCharts?: boolean;
  customStyles?: {
    headerColor?: string;
    textColor?: string;
    tableHeaderColor?: string;
    alternateRowColor?: string;
  };
}

export interface TableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ChartExportData {
  element: HTMLElement;
  title: string;
  width?: number;
  height?: number;
}

export class PDFExporter {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageMargin: number = 20;
  private lineHeight: number = 7;

  constructor(options: PDFExportOptions = { title: 'Manufacturing Report' }) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set up default styles
    this.setupDocument(options);
  }

  private setupDocument(options: PDFExportOptions) {
    const { title, subtitle, showHeader = true } = options;

    if (showHeader) {
      this.addHeader(title, subtitle);
    }
  }

  private addHeader(title: string, subtitle?: string) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    
    // Add company logo area (placeholder for now)
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.pageMargin, 10, pageWidth - (this.pageMargin * 2), 25, 'F');
    
    // Title
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, pageWidth / 2, 25, { align: 'center' });
    
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, pageWidth / 2, 32, { align: 'center' });
    }

    // Date and time
    this.doc.setFontSize(10);
    this.doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth - this.pageMargin, 15, { align: 'right' });
    
    this.currentY = 45;
  }

  private addFooter() {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('Manufacturing Management System', this.pageMargin, pageHeight - 10);
    this.doc.text(`Page ${this.doc.getNumberOfPages()}`, pageWidth - this.pageMargin, pageHeight - 10, { align: 'right' });
  }

  addSection(title: string, content?: string) {
    this.checkPageBreak(15);
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(50, 50, 50);
    this.doc.text(title, this.pageMargin, this.currentY);
    this.currentY += 8;
    
    // Underline
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.pageMargin, this.currentY - 2, this.pageMargin + titleWidth, this.currentY - 2);
    
    if (content) {
      this.currentY += 5;
      this.doc.setFontSize(10);
      this.doc.setTextColor(80, 80, 80);
      
      const lines = this.doc.splitTextToSize(content, this.doc.internal.pageSize.getWidth() - (this.pageMargin * 2));
      this.doc.text(lines, this.pageMargin, this.currentY);
      this.currentY += lines.length * this.lineHeight;
    }
    
    this.currentY += 10;
  }

  async addTable(data: any[], columns: TableColumn[], options?: {
    title?: string;
    showSummary?: boolean;
    customStyles?: any;
  }) {
    if (options?.title) {
      this.addSection(options.title);
    }

    this.checkPageBreak(50);

    const tableData = data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toLocaleString();
        if (value instanceof Date) return format(value, 'PP');
        return String(value);
      })
    );

    const startY = this.currentY;

    (this.doc as any).autoTable({
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: startY,
      margin: { left: this.pageMargin, right: this.pageMargin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [60, 60, 60],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 248, 255],
        textColor: [30, 30, 30],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: columns.reduce((acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      }, {} as any),
      ...options?.customStyles,
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

    // Add summary if requested
    if (options?.showSummary && data.length > 0) {
      this.addSummarySection(data, columns);
    }
  }

  private addSummarySection(data: any[], columns: TableColumn[]) {
    this.checkPageBreak(20);
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(50, 50, 50);
    this.doc.text('Summary', this.pageMargin, this.currentY);
    this.currentY += 8;

    // Calculate totals for numeric columns
    const numericColumns = columns.filter(col => {
      const firstValue = data[0]?.[col.dataKey];
      return typeof firstValue === 'number';
    });

    if (numericColumns.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(80, 80, 80);
      
      numericColumns.forEach(col => {
        const total = data.reduce((sum, row) => sum + (row[col.dataKey] || 0), 0);
        this.doc.text(`Total ${col.header}: ${total.toLocaleString()}`, this.pageMargin, this.currentY);
        this.currentY += this.lineHeight;
      });
    }

    this.doc.text(`Total Records: ${data.length}`, this.pageMargin, this.currentY);
    this.currentY += 15;
  }

  async addChart(chartElement: HTMLElement, title?: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }) {
    if (title) {
      this.addSection(title);
    }

    try {
      const canvas = await html2canvas(chartElement, {
        scale: options?.quality || 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = options?.width || 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      this.checkPageBreak(imgHeight + 10);

      this.doc.addImage(imgData, 'PNG', this.pageMargin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 15;
    } catch (error) {
      console.error('Error capturing chart:', error);
      this.doc.setFontSize(10);
      this.doc.setTextColor(200, 50, 50);
      this.doc.text('Chart could not be exported', this.pageMargin, this.currentY);
      this.currentY += 15;
    }
  }

  addKeyMetrics(metrics: { label: string; value: string | number; unit?: string }[]) {
    this.addSection('Key Metrics');
    
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const metricsPerRow = 3;
    const metricWidth = (pageWidth - (this.pageMargin * 2)) / metricsPerRow;
    
    metrics.forEach((metric, index) => {
      const row = Math.floor(index / metricsPerRow);
      const col = index % metricsPerRow;
      
      const x = this.pageMargin + (col * metricWidth);
      const y = this.currentY + (row * 25);
      
      // Metric box
      this.doc.setFillColor(245, 248, 255);
      this.doc.rect(x, y, metricWidth - 5, 20, 'F');
      
      // Metric label
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(metric.label, x + 3, y + 6);
      
      // Metric value
      this.doc.setFontSize(12);
      this.doc.setTextColor(30, 30, 30);
      const valueText = `${metric.value}${metric.unit || ''}`;
      this.doc.text(valueText, x + 3, y + 15);
    });
    
    const rows = Math.ceil(metrics.length / metricsPerRow);
    this.currentY += (rows * 25) + 10;
  }

  private checkPageBreak(requiredHeight: number) {
    const pageHeight = this.doc.internal.pageSize.getHeight();
    if (this.currentY + requiredHeight > pageHeight - 30) {
      this.addFooter();
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  save(filename?: string) {
    this.addFooter();
    const defaultFilename = `manufacturing-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    this.doc.save(filename || defaultFilename);
  }

  getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }

  getDataUrl(): string {
    this.addFooter();
    return this.doc.output('dataurlstring');
  }
}

// Helper functions for specific report types
export const exportOrdersReport = async (orders: any[], options?: PDFExportOptions) => {
  const exporter = new PDFExporter({
    title: 'Orders Report',
    subtitle: 'Manufacturing Order Management',
    ...options,
  });

  // Key metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);

  exporter.addKeyMetrics([
    { label: 'Total Orders', value: totalOrders },
    { label: 'Completed', value: completedOrders },
    { label: 'Completion Rate', value: `${Math.round((completedOrders / totalOrders) * 100)}`, unit: '%' },
    { label: 'Total Quantity', value: totalQuantity.toLocaleString() },
  ]);

  // Orders table
  await exporter.addTable(orders, [
    { header: 'Order ID', dataKey: 'id', width: 20 },
    { header: 'Customer', dataKey: 'customerName', width: 40 },
    { header: 'Date', dataKey: 'date', width: 30 },
    { header: 'Status', dataKey: 'status', width: 25 },
    { header: 'Quantity', dataKey: 'quantity', width: 25 },
  ], {
    title: 'Order Details',
    showSummary: true,
  });

  return exporter;
};

export const exportProductionReport = async (production: any[], options?: PDFExportOptions) => {
  const exporter = new PDFExporter({
    title: 'Production Report',
    subtitle: 'Manufacturing Production Analysis',
    orientation: 'landscape',
    ...options,
  });

  // Production metrics
  const totalProduced = production.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const activeLines = new Set(production.map(p => p.machine)).size;
  const avgEfficiency = production.reduce((sum, p) => sum + (p.efficiency || 0), 0) / production.length;

  exporter.addKeyMetrics([
    { label: 'Total Produced', value: totalProduced.toLocaleString() },
    { label: 'Active Lines', value: activeLines },
    { label: 'Avg Efficiency', value: `${Math.round(avgEfficiency)}`, unit: '%' },
  ]);

  // Production table
  await exporter.addTable(production, [
    { header: 'Job Order', dataKey: 'jobOrderId', width: 25 },
    { header: 'Product', dataKey: 'productName', width: 40 },
    { header: 'Machine', dataKey: 'machine', width: 30 },
    { header: 'Quantity', dataKey: 'quantity', width: 25 },
    { header: 'Status', dataKey: 'status', width: 25 },
    { header: 'Efficiency', dataKey: 'efficiency', width: 25 },
  ], {
    title: 'Production Details',
    showSummary: true,
  });

  return exporter;
};

export const exportQualityReport = async (qualityData: any[], options?: PDFExportOptions) => {
  const exporter = new PDFExporter({
    title: 'Quality Control Report',
    subtitle: 'Quality Assurance Analysis',
    ...options,
  });

  // Quality metrics
  const totalChecks = qualityData.length;
  const passedChecks = qualityData.filter(q => q.status === 'passed').length;
  const failedChecks = qualityData.filter(q => q.status === 'failed').length;
  const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

  exporter.addKeyMetrics([
    { label: 'Total Checks', value: totalChecks },
    { label: 'Passed', value: passedChecks },
    { label: 'Failed', value: failedChecks },
    { label: 'Pass Rate', value: `${Math.round(passRate)}`, unit: '%' },
  ]);

  // Quality checks table
  await exporter.addTable(qualityData, [
    { header: 'Check ID', dataKey: 'id', width: 20 },
    { header: 'Type', dataKey: 'checkType', width: 30 },
    { header: 'Product', dataKey: 'productName', width: 40 },
    { header: 'Status', dataKey: 'status', width: 25 },
    { header: 'Performed By', dataKey: 'performedBy', width: 30 },
    { header: 'Date', dataKey: 'timestamp', width: 30 },
  ], {
    title: 'Quality Check Details',
    showSummary: true,
  });

  return exporter;
};