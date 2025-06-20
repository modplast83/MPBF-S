import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDateString, formatNumber } from "@/lib/utils";
import { User, Section } from "@shared/schema";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface for workflow report data
interface WorkflowReportData {
  sections: SectionData[];
  operators: OperatorData[];
  items: ItemData[];
}

interface SectionData {
  id: string;
  name: string;
  rollCount: number;
  totalQuantity: number;
  wasteQuantity: number;
  wastePercentage: number;
  efficiency: number;
  productionTime: number; // In hours
}

interface OperatorData {
  id: string;
  name: string;
  section: string;
  jobsCount: number;
  rollsProcessed: number;
  totalQuantity: number;
  productionTime: number; // In hours
  efficiency: number;
}

interface ItemData {
  id: number;
  name: string;
  category: string;
  jobsCount: number;
  totalQuantity: number;
  finishedQuantity: number;
  wasteQuantity: number;
  wastePercentage: number;
}

export default function WorkflowReportsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("sections");
  
  // State for filters
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    sectionId: "",
    operatorId: "",
    itemId: ""
  });

  // Export configuration state
  const [exportConfig, setExportConfig] = useState({
    format: "excel" as "excel" | "pdf" | "csv",
    includeCharts: true,
    includeSections: true,
    includeOperators: true,
    includeItems: true,
    fileName: `workflow-report-${format(new Date(), "yyyy-MM-dd")}`,
    orientation: "landscape" as "landscape" | "portrait"
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export functions
  const exportToExcel = () => {
    if (!filteredReportData) return;

    const workbook = XLSX.utils.book_new();

    // Add sections sheet if included
    if (exportConfig.includeSections && filteredReportData.sections?.length > 0) {
      const sectionsData = filteredReportData.sections.map(section => ({
        'Section ID': section.id,
        'Section Name': section.name,
        'Rolls Count': section.rollCount,
        'Total Quantity (kg)': formatNumber(section.totalQuantity, 1),
        'Waste Quantity (kg)': formatNumber(section.wasteQuantity, 1),
        'Waste Percentage': `${formatNumber(section.wastePercentage, 1)}%`,
        'Efficiency': `${formatNumber(section.efficiency, 1)}%`,
        'Production Time (hours)': formatNumber(section.productionTime, 1)
      }));
      const sectionsSheet = XLSX.utils.json_to_sheet(sectionsData);
      XLSX.utils.book_append_sheet(workbook, sectionsSheet, 'Sections');
    }

    // Add operators sheet if included
    if (exportConfig.includeOperators && filteredReportData.operators?.length > 0) {
      const operatorsData = filteredReportData.operators.map(operator => {
        const user = users?.find(u => u.id === operator.id);
        const section = sections?.find(s => s.id === user?.sectionId);
        return {
          'Operator ID': operator.id,
          'Operator Name': operator.name,
          'Section': section ? section.name : (user?.sectionId || '-'),
          'Jobs Count': operator.jobsCount,
          'Rolls Processed': operator.rollsProcessed,
          'Total Quantity (kg)': formatNumber(operator.totalQuantity, 1),
          'Production Time (hours)': formatNumber(operator.productionTime, 1),
          'Efficiency': `${formatNumber(operator.efficiency, 1)}%`
        };
      });
      const operatorsSheet = XLSX.utils.json_to_sheet(operatorsData);
      XLSX.utils.book_append_sheet(workbook, operatorsSheet, 'Operators');
    }

    // Add items sheet if included
    if (exportConfig.includeItems && filteredReportData.items?.length > 0) {
      const itemsData = filteredReportData.items.map(item => ({
        'Item ID': item.id,
        'Item Name': item.name,
        'Category': item.category,
        'Jobs Count': item.jobsCount,
        'Total Quantity (kg)': formatNumber(item.totalQuantity, 1),
        'Finished Quantity (kg)': formatNumber(item.finishedQuantity, 1),
        'Waste Quantity (kg)': formatNumber(item.wasteQuantity, 1),
        'Waste Percentage': `${formatNumber(item.wastePercentage, 1)}%`
      }));
      const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');
    }

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Report Generated', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
      { 'Metric': 'Total Sections', 'Value': filteredReportData.sections?.length || 0 },
      { 'Metric': 'Total Operators', 'Value': filteredReportData.operators?.length || 0 },
      { 'Metric': 'Total Items', 'Value': filteredReportData.items?.length || 0 },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    XLSX.writeFile(workbook, `${exportConfig.fileName}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredReportData) return;

    const doc = new jsPDF(exportConfig.orientation);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Add title
    doc.setFontSize(18);
    doc.text('Workflow Report', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, pageWidth / 2, 30, { align: 'center' });

    let yPosition = 50;

    // Add sections table if included
    if (exportConfig.includeSections && filteredReportData.sections?.length > 0) {
      doc.setFontSize(14);
      doc.text('Sections Performance', 14, yPosition);
      yPosition += 10;

      const sectionsTableData = filteredReportData.sections.map(section => [
        section.id,
        section.name,
        section.rollCount.toString(),
        `${formatNumber(section.totalQuantity, 1)} kg`,
        `${formatNumber(section.wasteQuantity, 1)} kg`,
        `${formatNumber(section.wastePercentage, 1)}%`,
        `${formatNumber(section.efficiency, 1)}%`,
        `${formatNumber(section.productionTime, 1)} hrs`
      ]);

      autoTable(doc, {
        head: [['ID', 'Name', 'Rolls', 'Total Qty', 'Waste Qty', 'Waste %', 'Efficiency', 'Time']],
        body: sectionsTableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Add operators table if included and there's space
    if (exportConfig.includeOperators && filteredReportData.operators?.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Operators Performance', 14, yPosition);
      yPosition += 10;

      const operatorsTableData = filteredReportData.operators.map(operator => {
        const user = users?.find(u => u.id === operator.id);
        const section = sections?.find(s => s.id === user?.sectionId);
        return [
          operator.id,
          operator.name,
          section ? section.name : (user?.sectionId || '-'),
          operator.jobsCount.toString(),
          operator.rollsProcessed.toString(),
          `${formatNumber(operator.totalQuantity, 1)} kg`,
          `${formatNumber(operator.productionTime, 1)} hrs`,
          `${formatNumber(operator.efficiency, 1)}%`
        ];
      });

      autoTable(doc, {
        head: [['ID', 'Name', 'Section', 'Jobs', 'Rolls', 'Total Qty', 'Time', 'Efficiency']],
        body: operatorsTableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Add items table if included and there's space
    if (exportConfig.includeItems && filteredReportData.items?.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Items Performance', 14, yPosition);
      yPosition += 10;

      const itemsTableData = filteredReportData.items.map(item => [
        item.id.toString(),
        item.name,
        item.category,
        item.jobsCount.toString(),
        `${formatNumber(item.totalQuantity, 1)} kg`,
        `${formatNumber(item.finishedQuantity, 1)} kg`,
        `${formatNumber(item.wasteQuantity, 1)} kg`,
        `${formatNumber(item.wastePercentage, 1)}%`
      ]);

      autoTable(doc, {
        head: [['ID', 'Name', 'Category', 'Jobs', 'Total Qty', 'Finished', 'Waste', 'Waste %']],
        body: itemsTableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`${exportConfig.fileName}.pdf`);
  };

  const exportToCSV = () => {
    if (!filteredReportData) return;

    let csvContent = '';

    // Add sections data if included
    if (exportConfig.includeSections && filteredReportData.sections?.length > 0) {
      csvContent += 'SECTIONS\n';
      csvContent += 'Section ID,Section Name,Rolls Count,Total Quantity (kg),Waste Quantity (kg),Waste Percentage,Efficiency,Production Time (hours)\n';
      filteredReportData.sections.forEach(section => {
        csvContent += `${section.id},${section.name},${section.rollCount},${formatNumber(section.totalQuantity, 1)},${formatNumber(section.wasteQuantity, 1)},${formatNumber(section.wastePercentage, 1)}%,${formatNumber(section.efficiency, 1)}%,${formatNumber(section.productionTime, 1)}\n`;
      });
      csvContent += '\n';
    }

    // Add operators data if included
    if (exportConfig.includeOperators && filteredReportData.operators?.length > 0) {
      csvContent += 'OPERATORS\n';
      csvContent += 'Operator ID,Operator Name,Section,Jobs Count,Rolls Processed,Total Quantity (kg),Production Time (hours),Efficiency\n';
      filteredReportData.operators.forEach(operator => {
        const user = users?.find(u => u.id === operator.id);
        const section = sections?.find(s => s.id === user?.sectionId);
        const sectionName = section ? section.name : (user?.sectionId || '-');
        csvContent += `${operator.id},${operator.name},${sectionName},${operator.jobsCount},${operator.rollsProcessed},${formatNumber(operator.totalQuantity, 1)},${formatNumber(operator.productionTime, 1)},${formatNumber(operator.efficiency, 1)}%\n`;
      });
      csvContent += '\n';
    }

    // Add items data if included
    if (exportConfig.includeItems && filteredReportData.items?.length > 0) {
      csvContent += 'ITEMS\n';
      csvContent += 'Item ID,Item Name,Category,Jobs Count,Total Quantity (kg),Finished Quantity (kg),Waste Quantity (kg),Waste Percentage\n';
      filteredReportData.items.forEach(item => {
        csvContent += `${item.id},${item.name},${item.category},${item.jobsCount},${formatNumber(item.totalQuantity, 1)},${formatNumber(item.finishedQuantity, 1)},${formatNumber(item.wasteQuantity, 1)},${formatNumber(item.wastePercentage, 1)}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportConfig.fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!filteredReportData) {
      toast({
        title: t("common.error"),
        description: t("reports.no_data_to_export"),
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      switch (exportConfig.format) {
        case 'excel':
          exportToExcel();
          break;
        case 'pdf':
          exportToPDF();
          break;
        case 'csv':
          exportToCSV();
          break;
      }

      toast({
        title: t("common.success"),
        description: t("reports.export_success"),
      });

      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t("common.error"),
        description: t("reports.export_error"),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Fetch users for operators filter dropdown
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });
  
  // Fetch sections for sections filter dropdown
  const { data: sections, isLoading: sectionsLoading } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });
  
  // Fetch items for items filter dropdown
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  // Build the query parameters string for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    
    if (filters.sectionId) {
      params.append('sectionId', filters.sectionId);
    }
    
    if (filters.operatorId) {
      params.append('operatorId', filters.operatorId);
    }
    
    if (filters.itemId) {
      params.append('itemId', filters.itemId);
    }
    
    return params.toString();
  };
  
  // Fetch workflow report data with filters
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    refetch: refetchReport,
    isError: reportError
  } = useQuery<WorkflowReportData>({
    queryKey: [`/api/reports/workflow?${buildQueryParams()}`],
    enabled: true,
  });

  // Filter sections to only show Extruding, Printing, and Cutting
  const allowedSections = ['Extruding', 'Printing', 'Cutting'];
  const filteredSections = sections?.filter(section => 
    allowedSections.some(allowed => 
      section.name.toLowerCase().includes(allowed.toLowerCase())
    )
  ) || [];

  // Filter operators to only show those from allowed sections
  const filteredUsers = users?.filter(user => {
    // Check if user belongs to any of the allowed sections
    return user.sectionId && filteredSections.some(section => section.id === user.sectionId);
  }) || [];

  // Filter report data to only show allowed sections and operators
  const filteredReportData = reportData ? {
    ...reportData,
    sections: reportData.sections?.filter(section => 
      allowedSections.some(allowed => 
        section.name.toLowerCase().includes(allowed.toLowerCase())
      )
    ) || [],
    operators: reportData.operators?.filter(operator => {
      // Find the user and check if they belong to allowed sections
      const user = users?.find(u => u.id === operator.id);
      return user && user.sectionId && filteredSections.some(section => section.id === user.sectionId);
    }) || []
  } : null;
  
  // Effect to refetch when filters change
  useEffect(() => {
    refetchReport();
  }, [filters, refetchReport]);
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      sectionId: "",
      operatorId: "",
      itemId: ""
    });
  };
  
  // Prepare sections columns
  const sectionsColumns = [
    { 
      header: t("reports.section_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.section_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.rolls_count"), 
      accessorKey: "rollCount" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_quantity"), 
      accessorKey: "wasteQuantity",
      cell: (row: any) => `${formatNumber(row.wasteQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_percentage"), 
      accessorKey: "wastePercentage",
      cell: (row: any) => `${formatNumber(row.wastePercentage, 1)}%`
    },
    { 
      header: t("reports.efficiency"), 
      accessorKey: "efficiency",
      cell: (row: any) => `${formatNumber(row.efficiency, 1)}%`
    },
    { 
      header: t("reports.production_time"), 
      accessorKey: "productionTime",
      cell: (row: any) => `${formatNumber(row.productionTime, 1)} ${t("performance.hours")}`
    }
  ];
  
  // Prepare operators columns
  const operatorsColumns = [
    { 
      header: t("reports.operator_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.operator_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.section"), 
      accessorKey: "section",
      cell: (row: any) => {
        // Find the user to get their section ID
        const user = users?.find(u => u.id === row.id);
        if (!user || !user.sectionId) return '-';
        
        // Find the section name from the sections data
        const section = sections?.find(s => s.id === user.sectionId);
        return section ? section.name : user.sectionId;
      }
    },
    { 
      header: t("reports.jobs_count"), 
      accessorKey: "jobsCount" 
    },
    { 
      header: t("reports.rolls_processed"), 
      accessorKey: "rollsProcessed" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.production_time"), 
      accessorKey: "productionTime",
      cell: (row: any) => `${formatNumber(row.productionTime, 1)} ${t("performance.hours")}`
    },
    { 
      header: t("reports.efficiency"), 
      accessorKey: "efficiency",
      cell: (row: any) => `${formatNumber(row.efficiency, 1)}%`
    }
  ];
  
  // Prepare items columns
  const itemsColumns = [
    { 
      header: t("reports.item_id"), 
      accessorKey: "id" 
    },
    { 
      header: t("reports.item_name"), 
      accessorKey: "name" 
    },
    { 
      header: t("reports.category"), 
      accessorKey: "category" 
    },
    { 
      header: t("reports.jobs_count"), 
      accessorKey: "jobsCount" 
    },
    { 
      header: t("reports.total_quantity"), 
      accessorKey: "totalQuantity",
      cell: (row: any) => `${formatNumber(row.totalQuantity, 1)} kg`
    },
    { 
      header: t("reports.finished_quantity"), 
      accessorKey: "finishedQuantity",
      cell: (row: any) => `${formatNumber(row.finishedQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_quantity"), 
      accessorKey: "wasteQuantity",
      cell: (row: any) => `${formatNumber(row.wasteQuantity, 1)} kg`
    },
    { 
      header: t("reports.waste_percentage"), 
      accessorKey: "wastePercentage",
      cell: (row: any) => `${formatNumber(row.wastePercentage, 1)}%`
    }
  ];
  
  // Prepare chart data for sections (using filtered data)
  const prepareSectionsChartData = () => {
    if (!filteredReportData || !filteredReportData.sections || filteredReportData.sections.length === 0) return [];
    return filteredReportData.sections.map(section => ({
      name: section.name,
      totalQuantity: section.totalQuantity,
      wasteQuantity: section.wasteQuantity,
      efficiency: section.efficiency
    }));
  };
  
  // Prepare chart data for operators (using filtered data)
  const prepareOperatorsChartData = () => {
    if (!filteredReportData || !filteredReportData.operators || filteredReportData.operators.length === 0) return [];
    return filteredReportData.operators.map(operator => ({
      name: operator.name,
      rollsProcessed: operator.rollsProcessed,
      totalQuantity: operator.totalQuantity,
      efficiency: operator.efficiency
    }));
  };
  
  // Prepare chart data for items
  const prepareItemsChartData = () => {
    if (!reportData || !reportData.items || reportData.items.length === 0) return [];
    return reportData.items.map(item => ({
      name: item.name,
      totalQuantity: item.totalQuantity,
      finishedQuantity: item.finishedQuantity,
      wasteQuantity: item.wasteQuantity
    }));
  };
  
  // Render loading state
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.workflow_report")}
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-60 w-full mb-4" />
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const sectionsChartData = prepareSectionsChartData();
  const operatorsChartData = prepareOperatorsChartData();
  const itemsChartData = prepareItemsChartData();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-700">
            {t("reports.workflow_report")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing data for production sections: Extruding, Printing, and Cutting only
          </p>
        </div>
        <PDFExportButton
          data={filteredReportData?.sections || []}
          reportType="production"
          title="Workflow Production Report"
          subtitle="Manufacturing Process Analysis (Extruding, Printing, Cutting)"
          filename={`workflow-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
          columns={[
            { header: "Section", dataKey: "name" },
            { header: "Roll Count", dataKey: "rollCount" },
            { header: "Total Quantity", dataKey: "totalQuantity" },
            { header: "Waste %", dataKey: "wastePercentage" },
            { header: "Efficiency %", dataKey: "efficiency" }
          ]}
          variant="default"
          size="sm"
        />
      </div>
      
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.start_date")}</label>
              <DatePicker
                selected={filters.startDate}
                onSelect={(date) => setFilters({ ...filters, startDate: date })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.end_date")}</label>
              <DatePicker
                selected={filters.endDate}
                onSelect={(date) => setFilters({ ...filters, endDate: date })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.section")}</label>
              <Select 
                value={filters.sectionId || "all_sections"} 
                onValueChange={(value) => setFilters({ ...filters, sectionId: value === "all_sections" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_sections")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sections">{t("reports.all_sections")}</SelectItem>
                  {filteredSections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t("reports.operator")}</label>
              <Select 
                value={filters.operatorId || "all_operators"} 
                onValueChange={(value) => setFilters({ ...filters, operatorId: value === "all_operators" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reports.all_operators")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_operators">{t("reports.all_operators")}</SelectItem>
                  {filteredUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button className="flex-1" onClick={resetFilters} variant="outline">
                <span className="material-icons text-sm mr-1">refresh</span>
                {t("reports.reset")}
              </Button>
              <Button className="flex-1" onClick={() => refetchReport()}>
                <span className="material-icons text-sm mr-1">filter_alt</span>
                {t("reports.apply")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different report types */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.workflow_analytics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="sections" className="flex-1">
                <span className="material-icons text-sm mr-2">category</span>
                {t("reports.by_section")}
              </TabsTrigger>
              <TabsTrigger value="operators" className="flex-1">
                <span className="material-icons text-sm mr-2">person</span>
                {t("reports.by_operator")}
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-1">
                <span className="material-icons text-sm mr-2">ballot</span>
                {t("reports.by_item")}
              </TabsTrigger>
            </TabsList>
            
            {/* Sections Tab */}
            <TabsContent value="sections" className="py-2">
              {filteredReportData && filteredReportData.sections && filteredReportData.sections.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.section_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sectionsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar yAxisId="left" dataKey="wasteQuantity" name={t("reports.waste_quantity")} fill="#F44336" />
                        <Bar yAxisId="right" dataKey="efficiency" name={t("reports.efficiency")} fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.section_details")}</h3>
                    <DataTable
                      data={filteredReportData.sections}
                      columns={sectionsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
              )}
            </TabsContent>
            
            {/* Operators Tab */}
            <TabsContent value="operators" className="py-2">
              {filteredReportData && filteredReportData.operators && filteredReportData.operators.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.operator_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={operatorsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar yAxisId="left" dataKey="rollsProcessed" name={t("reports.rolls_processed")} fill="#FF9800" />
                        <Bar yAxisId="right" dataKey="efficiency" name={t("reports.efficiency")} fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.operator_details")}</h3>
                    <DataTable
                      data={filteredReportData.operators}
                      columns={operatorsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
              )}
            </TabsContent>
            
            {/* Items Tab */}
            <TabsContent value="items" className="py-2">
              {reportData && reportData.items && reportData.items.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">{t("reports.item_performance")}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={itemsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalQuantity" name={t("reports.total_quantity")} fill="#2196F3" />
                        <Bar dataKey="finishedQuantity" name={t("reports.finished_quantity")} fill="#4CAF50" />
                        <Bar dataKey="wasteQuantity" name={t("reports.waste_quantity")} fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t("reports.item_details")}</h3>
                    <DataTable
                      data={reportData.items}
                      columns={itemsColumns as any}
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="material-icons text-4xl text-gray-300 mb-2">assignment</span>
                  <p className="text-gray-500">{t("reports.no_data_available")}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Export section */}
          <div className="flex justify-end mt-6 space-x-2">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <span className="material-icons text-sm mr-1">download</span>
                  {t("reports.export_report")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("reports.export_configuration")}</DialogTitle>
                  <DialogDescription>
                    Configure export settings for the workflow report
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">{t("reports.export_format")}</Label>
                    <RadioGroup
                      value={exportConfig.format}
                      onValueChange={(value: "excel" | "pdf" | "csv") =>
                        setExportConfig(prev => ({ ...prev, format: value }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="excel" />
                        <Label htmlFor="excel" className="flex items-center cursor-pointer">
                          <span className="material-icons text-green-600 text-sm mr-1">table_chart</span>
                          Excel (.xlsx)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                          <span className="material-icons text-red-600 text-sm mr-1">picture_as_pdf</span>
                          PDF (.pdf)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="flex items-center cursor-pointer">
                          <span className="material-icons text-blue-600 text-sm mr-1">description</span>
                          CSV (.csv)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Content Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">{t("reports.include_content")}</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sections"
                          checked={exportConfig.includeSections}
                          onCheckedChange={(checked) =>
                            setExportConfig(prev => ({ ...prev, includeSections: !!checked }))
                          }
                        />
                        <Label htmlFor="sections" className="cursor-pointer">{t("reports.sections_data")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="operators"
                          checked={exportConfig.includeOperators}
                          onCheckedChange={(checked) =>
                            setExportConfig(prev => ({ ...prev, includeOperators: !!checked }))
                          }
                        />
                        <Label htmlFor="operators" className="cursor-pointer">{t("reports.operators_data")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="items"
                          checked={exportConfig.includeItems}
                          onCheckedChange={(checked) =>
                            setExportConfig(prev => ({ ...prev, includeItems: !!checked }))
                          }
                        />
                        <Label htmlFor="items" className="cursor-pointer">{t("reports.items_data")}</Label>
                      </div>
                    </div>
                  </div>

                  {/* PDF Orientation (only for PDF) */}
                  {exportConfig.format === 'pdf' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">{t("reports.pdf_orientation")}</Label>
                      <RadioGroup
                        value={exportConfig.orientation}
                        onValueChange={(value: "landscape" | "portrait") =>
                          setExportConfig(prev => ({ ...prev, orientation: value }))
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="landscape" id="landscape" />
                          <Label htmlFor="landscape" className="cursor-pointer">{t("reports.landscape")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="portrait" id="portrait" />
                          <Label htmlFor="portrait" className="cursor-pointer">{t("reports.portrait")}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* File Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fileName" className="text-sm font-medium">{t("reports.file_name")}</Label>
                    <input
                      id="fileName"
                      type="text"
                      value={exportConfig.fileName}
                      onChange={(e) =>
                        setExportConfig(prev => ({ ...prev, fileName: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="workflow-report"
                    />
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsExportDialogOpen(false)}
                      disabled={isExporting}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting || (!exportConfig.includeSections && !exportConfig.includeOperators && !exportConfig.includeItems)}
                    >
                      {isExporting ? (
                        <>
                          <span className="material-icons animate-spin text-sm mr-1">hourglass_empty</span>
                          {t("reports.exporting")}
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm mr-1">download</span>
                          {t("reports.export")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick Export Buttons */}
            <Button
              variant="outline"
              onClick={() => {
                setExportConfig(prev => ({ ...prev, format: 'excel' }));
                handleExport();
              }}
              disabled={!filteredReportData}
            >
              <span className="material-icons text-sm mr-1">table_chart</span>
              {t("reports.quick_excel")}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setExportConfig(prev => ({ ...prev, format: 'pdf' }));
                handleExport();
              }}
              disabled={!filteredReportData}
            >
              <span className="material-icons text-sm mr-1">picture_as_pdf</span>
              {t("reports.quick_pdf")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}