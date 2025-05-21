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
import { MixMaterial, MixItem, User, RawMaterial } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function MixReports() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [reportView, setReportView] = useState<'table' | 'chart'>('chart');

  // Fetch mix data
  const { data: mixMaterials } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });

  const { data: mixItems } = useQuery<MixItem[]>({
    queryKey: [API_ENDPOINTS.MIX_ITEMS],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
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

  // Get the filtered mix materials based on all filters
  const getFilteredMixMaterials = () => {
    if (!mixMaterials) return [];
    
    return mixMaterials.filter(mix => {
      // Date filter
      const passesDateFilter = filterByDateRange(mix.mixDate);
      
      // User filter
      const passesUserFilter = selectedUser === 'all' || mix.createdBy === selectedUser;
      
      // Material filter (need to check mixItems)
      const passesMaterialFilter = selectedMaterial === 'all' || 
        (mixItems?.some(item => 
          item.mixId === mix.id && 
          item.rawMaterialId === parseInt(selectedMaterial)
        ) ?? false);
      
      return passesDateFilter && passesUserFilter && passesMaterialFilter;
    });
  };

  const filteredMixMaterials = getFilteredMixMaterials();

  // For the table view
  const getMixReportData = () => {
    return filteredMixMaterials.map(mix => {
      // Get all items for this mix
      const items = mixItems?.filter(item => item.mixId === mix.id) || [];
      
      // Sum up total quantities
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Get materials used (names)
      const materialsUsed = items.map(item => {
        const rawMaterial = rawMaterials?.find(rm => rm.id === item.rawMaterialId);
        return rawMaterial?.name || `Material #${item.rawMaterialId}`;
      }).join(', ');
      
      // Get creator name
      const creator = users?.find(user => user.id === mix.createdBy);
      const creatorName = creator ? (creator.firstName && creator.lastName 
        ? `${creator.firstName} ${creator.lastName}`
        : creator.username) : 'Unknown';
      
      return {
        id: mix.id,
        mixDate: formatDateString(mix.mixDate),
        name: mix.name || `Mix #${mix.id}`,
        materialsUsed,
        totalQuantity,
        createdBy: creatorName,
        status: mix.status,
      };
    });
  };

  // For the charts
  const prepareMaterialUsageData = () => {
    if (!mixItems || !rawMaterials) return [];

    // Create a map to track total quantities
    const materialUsage: Record<string, number> = {};
    
    // Only consider items from filtered mixes
    const relevantMixIds = filteredMixMaterials.map(mix => mix.id);
    const relevantItems = mixItems.filter(item => relevantMixIds.includes(item.mixId));
    
    // Sum up quantities by material
    relevantItems.forEach(item => {
      const material = rawMaterials.find(rm => rm.id === item.rawMaterialId);
      const materialName = material ? material.name : `Material #${item.rawMaterialId}`;
      
      if (!materialUsage[materialName]) {
        materialUsage[materialName] = 0;
      }
      materialUsage[materialName] += item.quantity;
    });
    
    // Convert to chart data format
    return Object.entries(materialUsage).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const prepareMixesByUserData = () => {
    if (!filteredMixMaterials || !users) return [];
    
    // Group by user
    const userMixes: Record<string, number> = {};
    
    filteredMixMaterials.forEach(mix => {
      const user = users.find(u => u.id === mix.createdBy);
      const userName = user 
        ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username)
        : 'Unknown';
      
      if (!userMixes[userName]) {
        userMixes[userName] = 0;
      }
      userMixes[userName]++;
    });
    
    return Object.entries(userMixes).map(([name, value]) => ({
      name, 
      mixes: value,
    }));
  };

  const prepareMixesByMonthData = () => {
    if (!filteredMixMaterials) return [];
    
    // Group by month
    const monthlyData: Record<string, number> = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    filteredMixMaterials.forEach(mix => {
      const date = new Date(mix.mixDate);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear]++;
    });
    
    return Object.entries(monthlyData)
      .map(([name, count]) => ({ name, mixes: count }))
      .sort((a, b) => {
        // Extract month and year for proper sorting
        const [aMonth, aYear] = a.name.split(' ');
        const [bMonth, bYear] = b.name.split(' ');
        
        // Compare years first
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        
        // If years are the same, compare months
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
      });
  };

  // Prepare data for reports
  const mixReportData = getMixReportData();
  const materialUsageData = prepareMaterialUsageData();
  const mixesByUserData = prepareMixesByUserData();
  const mixesByMonthData = prepareMixesByMonthData();

  // Report columns
  const mixReportColumns = [
    { header: "ID", accessorKey: "id" },
    { header: "Mix Date", accessorKey: "mixDate" },
    { header: "Name", accessorKey: "name" },
    { header: "Materials Used", accessorKey: "materialsUsed" },
    { 
      header: "Total Quantity (Kg)", 
      accessorKey: "totalQuantity",
      cell: (row: any) => formatNumber(row.totalQuantity, 1)
    },
    { header: "Created By", accessorKey: "createdBy" },
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
    }
  ];

  // Mobile card view
  const renderMobileReportCards = () => {
    if (mixReportData.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for the selected criteria.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {mixReportData.map((mix, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">{mix.name}</CardTitle>
                <Badge 
                  variant={mix.status === 'completed' ? 'default' : 'outline'}
                  className={mix.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {mix.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm font-medium">#{mix.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mix Date</p>
                  <p className="text-sm font-medium">{mix.mixDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Materials Used</p>
                  <p className="text-sm font-medium truncate">{mix.materialsUsed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-sm font-medium">{formatNumber(mix.totalQuantity, 1)} Kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="text-sm font-medium">{mix.createdBy}</p>
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
          <h1 className="text-2xl font-bold text-secondary-900">Mix Materials Reports</h1>
          <p className="text-secondary-500">Analyze mix material usage and patterns</p>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
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
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Raw Material</label>
              <Select 
                value={selectedMaterial} 
                onValueChange={setSelectedMaterial}
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
              <label className="block text-sm font-medium mb-1">Created By</label>
              <Select 
                value={selectedUser} 
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
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
            
            <div>
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
          </div>
        </CardContent>
      </Card>
      
      {reportView === 'chart' ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {materialUsageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materialUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {materialUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatNumber(value as number, 1)} Kg`} />
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mixes by User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {mixesByUserData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mixesByUserData}
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
                        <Bar dataKey="mixes" fill="#8884d8" name="Number of Mixes" />
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
                <CardTitle>Mixes by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {mixesByMonthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mixesByMonthData}
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
                        <Bar dataKey="mixes" fill="#82ca9d" name="Number of Mixes" />
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
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 text-sm">Total Mixes</p>
                  <p className="text-2xl font-bold">{filteredMixMaterials.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-600 text-sm">Total Materials Used</p>
                  <p className="text-2xl font-bold">{materialUsageData.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-600 text-sm">Average Materials Per Mix</p>
                  <p className="text-2xl font-bold">
                    {filteredMixMaterials.length > 0
                      ? formatNumber(materialUsageData.length / filteredMixMaterials.length, 1)
                      : 0}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-amber-600 text-sm">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      materialUsageData.reduce((sum, item) => sum + item.value, 0),
                      1
                    )} Kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mix Materials Report</CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              renderMobileReportCards()
            ) : (
              <DataTable 
                data={mixReportData}
                columns={mixReportColumns as any}
              />
            )}
            <div className="mt-4 text-sm text-gray-500">
              Total: {mixReportData.length} mix records found
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}