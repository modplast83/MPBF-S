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
import { 
  Order, JobOrder, Roll, MixMaterial, MixItem, 
  QualityCheck, QualityViolation, User, RawMaterial,
  Section, Machine 
} from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from "recharts";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function ReportsDashboard() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Fetch data
  const { data: orders } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: rolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  const { data: mixMaterials } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });

  const { data: qualityChecks } = useQuery<QualityCheck[]>({
    queryKey: [API_ENDPOINTS.QUALITY_CHECKS],
  });

  const { data: qualityViolations } = useQuery<QualityViolation[]>({
    queryKey: [API_ENDPOINTS.QUALITY_VIOLATIONS],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
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

  // Data preparation for overview reports
  
  // Orders overview - by status and date
  const prepareOrdersOverviewData = () => {
    if (!orders) return [];
    
    const filteredOrders = orders.filter(order => filterByDateRange(order.date));
    
    // Group by status
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const status = order.status;
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status]++;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  // Production overview - rolls by stage
  const prepareProductionOverviewData = () => {
    if (!rolls) return [];
    
    const filteredRolls = rolls.filter(roll => roll.createdAt ? filterByDateRange(roll.createdAt) : true);
    
    // Group by stage
    const stageCounts: Record<string, number> = {
      extrusion: 0,
      printing: 0,
      cutting: 0,
      completed: 0,
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
    
    return Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
  };

  // Quality overview - violations by severity
  const prepareQualityOverviewData = () => {
    if (!qualityViolations) return [];
    
    const filteredViolations = qualityViolations.filter(violation => 
      violation.reportedDate ? filterByDateRange(violation.reportedDate) : true
    );
    
    // Group by severity
    const severityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    
    filteredViolations.forEach(violation => {
      const severity = violation.severity.toLowerCase();
      if (severityCounts[severity] !== undefined) {
        severityCounts[severity]++;
      }
    });
    
    return Object.entries(severityCounts).map(([name, value]) => ({ name, value }));
  };

  // Production over time data
  const prepareProductionOverTimeData = () => {
    if (!rolls) return [];
    
    // Group by time period
    const rollsOverTime: Record<string, { rolls: number, quantity: number }> = {};
    
    rolls.forEach(roll => {
      if (!roll.createdAt) return;
      
      const date = new Date(roll.createdAt);
      if (!filterByDateRange(date)) return;
      
      let timeKey: string;
      
      // Format date key based on selected period
      switch(period) {
        case 'daily':
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get week number
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
        rollsOverTime[timeKey] = { rolls: 0, quantity: 0 };
      }
      
      rollsOverTime[timeKey].rolls++;
      rollsOverTime[timeKey].quantity += roll.extrusionQty || 0;
    });
    
    // Convert to array format for charts
    return Object.entries(rollsOverTime)
      .map(([name, data]) => ({ 
        name, 
        rolls: data.rolls,
        quantity: data.quantity,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Section performance data
  const prepareSectionPerformanceData = () => {
    if (!rolls || !sections) return [];
    
    // Track performance by section
    const sectionPerformance: Record<string, { rolls: number, quantity: number }> = {};
    
    // Initialize all sections
    sections.forEach(section => {
      sectionPerformance[section.name] = { rolls: 0, quantity: 0 };
    });
    
    // Add data for 'Other' category
    sectionPerformance['Other'] = { rolls: 0, quantity: 0 };
    
    // Aggregate roll data by section
    rolls.forEach(roll => {
      if (!roll.createdAt || !filterByDateRange(roll.createdAt)) return;
      
      // In a real implementation, you would have a proper way to connect rolls to sections
      // This is a placeholder logic that would need to be updated based on actual data model
      const sectionName = 'Other'; // Placeholder - would need actual section name logic
      
      if (sectionPerformance[sectionName]) {
        sectionPerformance[sectionName].rolls++;
        sectionPerformance[sectionName].quantity += roll.extrusionQty || 0;
      } else {
        sectionPerformance['Other'].rolls++;
        sectionPerformance['Other'].quantity += roll.extrusionQty || 0;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(sectionPerformance)
      .filter(([_, data]) => data.rolls > 0) // Only include sections with data
      .map(([name, data]) => ({ 
        name, 
        rolls: data.rolls,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity); // Sort by quantity descending
  };

  // Prepare report data
  const ordersOverviewData = prepareOrdersOverviewData();
  const productionOverviewData = prepareProductionOverviewData();
  const qualityOverviewData = prepareQualityOverviewData();
  const productionOverTimeData = prepareProductionOverTimeData();
  const sectionPerformanceData = prepareSectionPerformanceData();

  // Calculate summary statistics
  const getTotalOrders = () => {
    if (!orders) return 0;
    return orders.filter(order => filterByDateRange(order.date)).length;
  };

  const getCompletedOrders = () => {
    if (!orders) return 0;
    return orders.filter(order => 
      filterByDateRange(order.date) && order.status === 'completed'
    ).length;
  };

  const getTotalRolls = () => {
    if (!rolls) return 0;
    return rolls.filter(roll => 
      roll.createdAt ? filterByDateRange(roll.createdAt) : true
    ).length;
  };

  const getTotalProduction = () => {
    if (!rolls) return 0;
    return rolls
      .filter(roll => roll.createdAt ? filterByDateRange(roll.createdAt) : true)
      .reduce((sum, roll) => sum + (roll.extrusionQty || 0), 0);
  };

  const getTotalQualityIssues = () => {
    if (!qualityViolations) return 0;
    return qualityViolations.filter(violation => 
      violation.reportedDate ? filterByDateRange(violation.reportedDate) : true
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Reports Dashboard</h1>
          <p className="text-secondary-500">Comprehensive overview of factory operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1">download</span>
            Export
          </Button>
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1">print</span>
            Print
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium mb-1">Section</label>
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections?.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">User</label>
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
                  placeholder="Start date"
                />
                <DatePicker
                  selected={dateRange.end}
                  onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-2xl text-blue-500 mb-2">receipt</span>
              <p className="text-sm text-secondary-500">Total Orders</p>
              <p className="text-2xl font-bold">{getTotalOrders()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-2xl text-green-500 mb-2">check_circle</span>
              <p className="text-sm text-secondary-500">Completed Orders</p>
              <p className="text-2xl font-bold">{getCompletedOrders()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-2xl text-purple-500 mb-2">category</span>
              <p className="text-sm text-secondary-500">Total Rolls</p>
              <p className="text-2xl font-bold">{getTotalRolls()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-2xl text-amber-500 mb-2">inventory</span>
              <p className="text-sm text-secondary-500">Total Production</p>
              <p className="text-2xl font-bold">{formatNumber(getTotalProduction(), 1)} Kg</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-2xl text-red-500 mb-2">warning</span>
              <p className="text-sm text-secondary-500">Quality Issues</p>
              <p className="text-2xl font-bold">{getTotalQualityIssues()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {ordersOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersOverviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {ordersOverviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                  <p className="text-gray-500">No data available for the selected criteria.</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href="/reports/orders" className="text-sm text-primary-600 flex items-center">
                <span>View detailed orders report</span>
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Production by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {productionOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productionOverviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {productionOverviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                  <p className="text-gray-500">No data available for the selected criteria.</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href="/reports/roll-reports" className="text-sm text-primary-600 flex items-center">
                <span>View detailed production report</span>
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quality Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {qualityOverviewData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityOverviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {qualityOverviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                  <p className="text-gray-500">No data available for the selected criteria.</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href="/reports/quality" className="text-sm text-primary-600 flex items-center">
                <span>View detailed quality report</span>
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Time-based Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Production Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {productionOverTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={productionOverTimeData}
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
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="rolls" 
                    name="Number of Rolls" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="quantity" 
                    name="Production Quantity (Kg)" 
                    stroke="#82ca9d" 
                  />
                </LineChart>
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
          <CardTitle>Section Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {sectionPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectionPerformanceData}
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
                    name="Number of Rolls" 
                    fill="#8884d8" 
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="quantity" 
                    name="Production Quantity (Kg)" 
                    fill="#82ca9d" 
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
      
      {/* Report Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/reports/roll-reports" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Roll Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-blue-50 rounded mb-3">
                <span className="material-icons text-4xl text-blue-400">category</span>
              </div>
              <p className="text-sm text-gray-600">
                Comprehensive roll reports by stage, operator, material and more
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/reports/mix-reports" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mix Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-green-50 rounded mb-3">
                <span className="material-icons text-4xl text-green-400">blender</span>
              </div>
              <p className="text-sm text-gray-600">
                Analyze mix material usage, operators, and patterns
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/reports/quality" className="block no-underline text-current">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quality Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 bg-purple-50 rounded mb-3">
                <span className="material-icons text-4xl text-purple-400">verified</span>
              </div>
              <p className="text-sm text-gray-600">
                Track quality issues, violations, and corrective actions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}