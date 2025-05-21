import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDateString, formatNumber } from "@/lib/utils";
import { Roll, JobOrder, User, RawMaterial, MasterBatch, Section } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Stage definitions for filtering and display
const STAGES = [
  { id: 'all', name: 'All Stages' },
  { id: 'extrusion', name: 'Extrusion' },
  { id: 'printing', name: 'Printing' },
  { id: 'cutting', name: 'Cutting' }
];

export default function RollReports() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<string>('all');
  const [selectedMasterBatch, setSelectedMasterBatch] = useState<string>('all');
  const [reportView, setReportView] = useState<'table' | 'chart'>('chart');
  const [activeTab, setActiveTab] = useState<string>('production');

  // Fetch data
  const { data: rolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });

  const { data: masterBatches } = useQuery<MasterBatch[]>({
    queryKey: [API_ENDPOINTS.MASTER_BATCHES],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });

  const { data: extrusionRolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS_STAGE_EXTRUSION],
  });

  const { data: printingRolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS_STAGE_PRINTING],
  });

  const { data: cuttingRolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS_STAGE_CUTTING],
  });

  // Filter by date range
  const filterByDateRange = (dateStr: string | Date) => {
    if (!dateRange.start && !dateRange.end) return true;
    
    const itemDate = new Date(dateStr);
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    if (startDate && endDate) {
      return itemDate >= startDate && itemDate <= endDate;
    } else if (startDate) {
      return itemDate >= startDate;
    } else if (endDate) {
      return itemDate <= endDate;
    }
    
    return true;
  };

  // Get filtered rolls based on all filters
  const getFilteredRolls = () => {
    let filteredRolls = [...(rolls || [])];
    
    if (selectedStage !== 'all') {
      switch (selectedStage) {
        case 'extrusion':
          filteredRolls = [...(extrusionRolls || [])];
          break;
        case 'printing':
          filteredRolls = [...(printingRolls || [])];
          break;
        case 'cutting':
          filteredRolls = [...(cuttingRolls || [])];
          break;
      }
    }
    
    return filteredRolls.filter(roll => {
      // Date filter - apply to creation date or date most relevant for the stage
      const dateToCheck = roll.createdAt || new Date(); // Fallback to now if undefined
      const passesDateFilter = filterByDateRange(dateToCheck);
      
      // User filter (creator or operator)
      const passesUserFilter = selectedUser === 'all' || 
                              roll.createdBy === selectedUser || 
                              roll.extrusionOperator === selectedUser ||
                              roll.printingOperator === selectedUser ||
                              roll.cuttingOperator === selectedUser;
      
      // Raw material filter
      const passesRawMaterialFilter = selectedRawMaterial === 'all' || 
                                     roll.rawMaterialId === parseInt(selectedRawMaterial);
      
      // Master batch filter
      const passesMasterBatchFilter = selectedMasterBatch === 'all' || 
                                     roll.masterBatchId === selectedMasterBatch;
      
      // Section/Machine filters would require additional data relationships
      // Simplified version here, would need to be expanded based on actual data model
      
      return passesDateFilter && passesUserFilter && 
             passesRawMaterialFilter && passesMasterBatchFilter;
    });
  };

  const filteredRolls = getFilteredRolls();

  // For the table view
  const getRollReportData = () => {
    return filteredRolls.map(roll => {
      // Get job order details
      const jobOrder = jobOrders?.find(jo => jo.id === roll.jobOrderId);
      
      // Get user information
      const creator = users?.find(user => user.id === roll.createdBy);
      const creatorName = creator ? (creator.firstName && creator.lastName 
        ? `${creator.firstName} ${creator.lastName}`
        : creator.username) : 'Unknown';
      
      // Get material information
      const rawMaterial = rawMaterials?.find(rm => rm.id === roll.rawMaterialId);
      const masterBatch = masterBatches?.find(mb => mb.id === roll.masterBatchId);
      
      return {
        id: roll.id,
        createdAt: formatDateString(roll.createdAt || new Date()),
        jobOrderId: roll.jobOrderId,
        stage: roll.stage,
        status: roll.status,
        extrusionQty: roll.extrusionQty || 0,
        printingQty: roll.printingQty || 0,
        cuttingQty: roll.cuttingQty || 0,
        weight: roll.weight || 0,
        rollWidth: roll.rollWidth || 0,
        rawMaterial: rawMaterial?.name || 'Unknown',
        masterBatch: masterBatch?.name || 'Unknown',
        createdBy: creatorName,
        operator: roll.stage === 'extrusion' 
                  ? getUserName(roll.extrusionOperator)
                  : roll.stage === 'printing'
                    ? getUserName(roll.printingOperator)
                    : getUserName(roll.cuttingOperator)
      };
    });
  };

  // Helper to get user name
  const getUserName = (userId: string | undefined | null) => {
    if (!userId) return 'Not assigned';
    const user = users?.find(u => u.id === userId);
    return user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username)
      : 'Unknown';
  };

  // Data preparation for charts
  const prepareRollsByStageData = () => {
    const stageCounts = {
      extrusion: 0,
      printing: 0,
      cutting: 0,
      completed: 0
    };
    
    filteredRolls.forEach(roll => {
      if (roll.status === 'completed') {
        stageCounts.completed++;
      } else if (roll.stage === 'extrusion') {
        stageCounts.extrusion++;
      } else if (roll.stage === 'printing') {
        stageCounts.printing++;
      } else if (roll.stage === 'cutting') {
        stageCounts.cutting++;
      }
    });
    
    return [
      { name: 'Extrusion', value: stageCounts.extrusion },
      { name: 'Printing', value: stageCounts.printing },
      { name: 'Cutting', value: stageCounts.cutting },
      { name: 'Completed', value: stageCounts.completed }
    ];
  };

  const prepareRollsByStatusData = () => {
    const statusCounts: Record<string, number> = {};
    
    filteredRolls.forEach(roll => {
      const status = roll.status || 'unknown';
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status]++;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const prepareRollsOverTimeData = () => {
    // Group by day, week, month, or year based on the selected period
    const rollsOverTime: Record<string, number> = {};
    
    filteredRolls.forEach(roll => {
      const date = new Date(roll.createdAt || new Date());
      let timeKey: string;
      
      switch (period) {
        case 'daily':
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          timeKey = `Week ${weekNum}, ${date.getFullYear()}`;
          break;
        case 'monthly':
          timeKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          break;
        case 'yearly':
          timeKey = date.getFullYear().toString();
          break;
        default:
          timeKey = date.toISOString().split('T')[0];
      }
      
      if (!rollsOverTime[timeKey]) {
        rollsOverTime[timeKey] = 0;
      }
      rollsOverTime[timeKey]++;
    });
    
    // Convert to array and sort by date
    return Object.entries(rollsOverTime)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Sort based on the time period
        if (period === 'yearly') {
          return parseInt(a.name) - parseInt(b.name);
        }
        
        // For other periods, we need more complex sorting
        // This is a simplified approach
        return a.name.localeCompare(b.name);
      });
  };

  const prepareOperatorProductivityData = () => {
    // Track rolls and quantities by operator
    const operatorData: Record<string, { rolls: number, quantity: number }> = {};
    
    filteredRolls.forEach(roll => {
      let operatorId;
      let quantity = 0;
      
      if (roll.stage === 'extrusion') {
        operatorId = roll.extrusionOperator;
        quantity = roll.extrusionQty || 0;
      } else if (roll.stage === 'printing') {
        operatorId = roll.printingOperator;
        quantity = roll.printingQty || 0;
      } else if (roll.stage === 'cutting') {
        operatorId = roll.cuttingOperator;
        quantity = roll.cuttingQty || 0;
      }
      
      if (operatorId) {
        const operatorName = getUserName(operatorId);
        
        if (!operatorData[operatorName]) {
          operatorData[operatorName] = { rolls: 0, quantity: 0 };
        }
        
        operatorData[operatorName].rolls++;
        operatorData[operatorName].quantity += quantity;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(operatorData)
      .map(([name, data]) => ({
        name,
        rolls: data.rolls,
        quantity: data.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity) // Sort by quantity descending
      .slice(0, 10); // Top 10 operators
  };

  // Prepare data for reports
  const rollReportData = getRollReportData();
  const rollsByStageData = prepareRollsByStageData();
  const rollsByStatusData = prepareRollsByStatusData();
  const rollsOverTimeData = prepareRollsOverTimeData();
  const operatorProductivityData = prepareOperatorProductivityData();

  // Report columns
  const rollReportColumns = [
    { header: "ID", accessorKey: "id" },
    { header: "Date", accessorKey: "createdAt" },
    { header: "JO #", accessorKey: "jobOrderId" },
    { header: "Stage", accessorKey: "stage" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row: any) => (
        <Badge 
          variant={row.status === 'completed' ? 'default' : 'outline'}
          className={row.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
        >
          {row.status}
        </Badge>
      )
    },
    { 
      header: "Extrusion Qty", 
      accessorKey: "extrusionQty",
      cell: (row: any) => formatNumber(row.extrusionQty, 1)
    },
    { 
      header: "Printing Qty", 
      accessorKey: "printingQty",
      cell: (row: any) => formatNumber(row.printingQty, 1)
    },
    { 
      header: "Cutting Qty", 
      accessorKey: "cuttingQty",
      cell: (row: any) => formatNumber(row.cuttingQty, 1)
    },
    { header: "Width", accessorKey: "rollWidth" },
    { header: "Material", accessorKey: "rawMaterial" },
    { header: "Master Batch", accessorKey: "masterBatch" },
    { header: "Operator", accessorKey: "operator" }
  ];

  // Mobile card view
  const renderMobileReportCards = () => {
    if (rollReportData.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for the selected criteria.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {rollReportData.map((roll, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">{roll.id}</CardTitle>
                <Badge 
                  variant={roll.status === 'completed' ? 'default' : 'outline'}
                  className={roll.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {roll.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{roll.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">JO #</p>
                  <p className="text-sm font-medium">{roll.jobOrderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stage</p>
                  <p className="text-sm font-medium">{roll.stage}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Operator</p>
                  <p className="text-sm font-medium truncate">{roll.operator}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Material</p>
                  <p className="text-sm font-medium truncate">{roll.rawMaterial}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Master Batch</p>
                  <p className="text-sm font-medium truncate">{roll.masterBatch}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm font-medium">
                    {formatNumber(
                      roll.stage === 'extrusion' 
                        ? roll.extrusionQty 
                        : roll.stage === 'printing'
                          ? roll.printingQty
                          : roll.cuttingQty,
                      1
                    )} Kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Width</p>
                  <p className="text-sm font-medium">{roll.rollWidth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Roll Production Reports</h1>
          <p className="text-secondary-500">Track and analyze roll production across all stages</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={reportView === 'chart' ? 'default' : 'outline'} 
            onClick={() => setReportView('chart')}
            size="sm"
          >
            <span className="material-icons text-sm mr-1">bar_chart</span>
            Charts
          </Button>
          <Button 
            variant={reportView === 'table' ? 'default' : 'outline'} 
            onClick={() => setReportView('table')}
            size="sm"
          >
            <span className="material-icons text-sm mr-1">table_view</span>
            Table
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-6">
          <TabsTrigger value="production" className="text-xs sm:text-sm">
            <span className="material-icons text-sm mr-1">precision_manufacturing</span>
            Production
          </TabsTrigger>
          <TabsTrigger value="quality" className="text-xs sm:text-sm">
            <span className="material-icons text-sm mr-1">verified</span>
            Quality
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">
            <span className="material-icons text-sm mr-1">speed</span>
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Production Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Time Period</label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Stage</label>
                  <Select 
                    value={selectedStage} 
                    onValueChange={setSelectedStage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Raw Material</label>
                  <Select 
                    value={selectedRawMaterial} 
                    onValueChange={setSelectedRawMaterial}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Materials</SelectItem>
                      {rawMaterials?.map(material => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Master Batch</label>
                  <Select 
                    value={selectedMasterBatch} 
                    onValueChange={setSelectedMasterBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select master batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Master Batches</SelectItem>
                      {masterBatches?.map(mb => (
                        <SelectItem key={mb.id} value={mb.id}>
                          {mb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Operator</label>
                  <Select 
                    value={selectedUser} 
                    onValueChange={setSelectedUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Operators</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 sm:col-span-2 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <DatePicker
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                      placeholderText="Start date"
                    />
                    <DatePicker
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                      placeholderText="End date"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2 md:col-span-1 flex items-end">
                  <Button className="w-full">
                    <span className="material-icons text-sm mr-1">search</span>
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {reportView === 'chart' ? (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rolls by Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {rollsByStageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={rollsByStageData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={(entry) => entry.name}
                            >
                              {rollsByStageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} rolls`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                          <p className="text-gray-500">No data available for the selected criteria.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Rolls by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {rollsByStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={rollsByStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={(entry) => entry.name}
                            >
                              {rollsByStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} rolls`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                          <p className="text-gray-500">No data available for the selected criteria.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Rolls Production Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {rollsOverTimeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={rollsOverTimeData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            name="Number of Rolls" 
                            fill="#8884d8" 
                            stroke="#8884d8"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                        <p className="text-gray-500">No data available for the selected criteria.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Operator Productivity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {operatorProductivityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={operatorProductivityData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={60}
                          />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            yAxisId="left" 
                            dataKey="rolls" 
                            fill="#8884d8" 
                            name="Number of Rolls" 
                          />
                          <Bar 
                            yAxisId="right" 
                            dataKey="quantity" 
                            fill="#82ca9d" 
                            name="Total Quantity (Kg)" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                        <p className="text-gray-500">No data available for the selected criteria.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Production Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-600 text-sm">Total Rolls</p>
                      <p className="text-2xl font-bold">{filteredRolls.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-600 text-sm">Completed Rolls</p>
                      <p className="text-2xl font-bold">
                        {filteredRolls.filter(r => r.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-600 text-sm">Total Extrusion Qty</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(
                          filteredRolls.reduce((sum, roll) => sum + (roll.extrusionQty || 0), 0),
                          1
                        )} Kg
                      </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-amber-600 text-sm">Total Cutting Qty</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(
                          filteredRolls.reduce((sum, roll) => sum + (roll.cuttingQty || 0), 0),
                          1
                        )} Kg
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Rolls Production Report</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  renderMobileReportCards()
                ) : (
                  <DataTable 
                    data={rollReportData}
                    columns={rollReportColumns as any}
                  />
                )}
                <div className="mt-4 text-sm text-gray-500">
                  Total: {rollReportData.length} roll records found
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="quality" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Quality Reports Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded border border-dashed border-gray-300">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400">verified</span>
                  <p className="mt-2 text-gray-500">Detailed quality reports for rolls will be available soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded border border-dashed border-gray-300">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400">speed</span>
                  <p className="mt-2 text-gray-500">Detailed performance reports for rolls will be available soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}