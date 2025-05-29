import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  PDFExporter, 
  PDFExportOptions, 
  TableColumn,
  exportOrdersReport,
  exportProductionReport,
  exportQualityReport 
} from '@/lib/pdf-export';

export interface PDFExportButtonProps {
  data: any[];
  reportType: 'orders' | 'production' | 'quality' | 'custom';
  title: string;
  subtitle?: string;
  filename?: string;
  columns?: TableColumn[];
  chartElements?: HTMLElement[];
  options?: PDFExportOptions;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PDFExportButton = ({
  data,
  reportType,
  title,
  subtitle,
  filename,
  columns,
  chartElements,
  options,
  variant = 'outline',
  size = 'default',
  className = ''
}: PDFExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data Available",
        description: "There is no data to export. Please ensure the report contains data.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      let exporter: PDFExporter;

      switch (reportType) {
        case 'orders':
          exporter = await exportOrdersReport(data, {
            title,
            subtitle,
            ...options
          });
          break;

        case 'production':
          exporter = await exportProductionReport(data, {
            title,
            subtitle,
            orientation: 'landscape',
            ...options
          });
          break;

        case 'quality':
          exporter = await exportQualityReport(data, {
            title,
            subtitle,
            ...options
          });
          break;

        case 'custom':
        default:
          exporter = new PDFExporter({
            title,
            subtitle,
            ...options
          });

          // Add custom table if columns are provided
          if (columns && columns.length > 0) {
            await exporter.addTable(data, columns, {
              title: 'Report Data',
              showSummary: true
            });
          }

          // Add charts if provided
          if (chartElements && chartElements.length > 0) {
            for (const chart of chartElements) {
              await exporter.addChart(chart, 'Chart Analysis');
            }
          }
          break;
      }

      // Save the PDF
      exporter.save(filename);

      toast({
        title: "Export Successful",
        description: `${title} has been exported to PDF successfully.`,
      });

    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
};

// Hook for easier PDF export functionality
export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async (config: {
    data: any[];
    reportType: 'orders' | 'production' | 'quality' | 'custom';
    title: string;
    subtitle?: string;
    filename?: string;
    columns?: TableColumn[];
    chartElements?: HTMLElement[];
    options?: PDFExportOptions;
  }) => {
    const { 
      data, 
      reportType, 
      title, 
      subtitle, 
      filename, 
      columns, 
      chartElements, 
      options 
    } = config;

    if (!data || data.length === 0) {
      toast({
        title: "No Data Available",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return false;
    }

    setIsExporting(true);

    try {
      let exporter: PDFExporter;

      switch (reportType) {
        case 'orders':
          exporter = await exportOrdersReport(data, { title, subtitle, ...options });
          break;
        case 'production':
          exporter = await exportProductionReport(data, { 
            title, 
            subtitle, 
            orientation: 'landscape', 
            ...options 
          });
          break;
        case 'quality':
          exporter = await exportQualityReport(data, { title, subtitle, ...options });
          break;
        case 'custom':
        default:
          exporter = new PDFExporter({ title, subtitle, ...options });
          if (columns && columns.length > 0) {
            await exporter.addTable(data, columns, {
              title: 'Report Data',
              showSummary: true
            });
          }
          if (chartElements && chartElements.length > 0) {
            for (const chart of chartElements) {
              await exporter.addChart(chart, 'Chart Analysis');
            }
          }
          break;
      }

      exporter.save(filename);

      toast({
        title: "Export Successful",
        description: `${title} has been exported successfully.`,
      });

      return true;
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the PDF.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, isExporting };
};

// Quick export functions for common use cases
export const QuickExportButton = ({ 
  data, 
  type, 
  title 
}: { 
  data: any[]; 
  type: 'orders' | 'production' | 'quality'; 
  title: string;
}) => (
  <PDFExportButton
    data={data}
    reportType={type}
    title={title}
    variant="outline"
    size="sm"
    className="ml-2"
  />
);

export default PDFExportButton;