import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { API_ENDPOINTS } from "@/lib/constants";
import { formatDateString, formatNumber } from "@/lib/utils";
import { Roll, User, Section, Order, JobOrder } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function UserSectionReports() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('users');

  // Fetch data
  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });

  const { data: rolls } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
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

  // Helper to get user name
  const getUserName = (userId: string | undefined | null) => {
    if (!userId) return 'Not assigned';
    const user = users?.find(u => u.id === userId);
    return user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username)
      : 'Unknown';
  };

  // Prepare data for user reports
  const prepareUserActivityData = () => {
    if (!rolls || !users) return [];
    
    // For this example, we're assuming rolls are a good proxy for user activity
    // This would be enriched with actual user activity data in a real implementation
    
    // Track activity by user
    const userActivity: Record<string, { rolls: number, quantity: number }> = {};
    
    // Initialize for all users
    users.forEach(user => {
      userActivity[getUserName(user.id)] = { rolls: 0, quantity: 0 };
    });
    
    // Count rolls associated with each user
    rolls.forEach(roll => {
      if (!roll.createdAt || !filterByDateRange(roll.createdAt)) return;
      
      // In a real implementation, you'd have more precise user attribution
      // This is a simplified example
      const creator = roll.createdById ? getUserName(roll.createdById) : 'Unknown';
      
      if (userActivity[creator]) {
        userActivity[creator].rolls++;
        userActivity[creator].quantity += roll.extrudingQty || 0;
      } else {
        userActivity[creator] = { rolls: 1, quantity: roll.extrudingQty || 0 };
      }
    });
    
    // Convert to array format for charts
    return Object.entries(userActivity)
      .filter(([_, data]) => data.rolls > 0) // Only include users with activity
      .map(([name, data]) => ({ 
        name, 
        rolls: data.rolls,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity); // Sort by quantity descending
  };

  // Prepare data for section reports
  const prepareSectionPerformanceData = () => {
    if (!sections) return [];
    
    // This is a placeholder implementation that would be 
    // connected to actual section data in a real application
    
    // For now, generate sample data based on sections
    return sections.map(section => ({
      name: section.name,
      rolls: Math.floor(Math.random() * 50) + 10, // Random data for example
      quantity: Math.floor(Math.random() * 5000) + 1000, // Random data for example
      efficiency: Math.floor(Math.random() * 30) + 70, // Random efficiency percentage
    }))
    .sort((a, b) => b.quantity - a.quantity); // Sort by quantity descending
  };

  // Prepare user-specific report
  const prepareUserReportData = () => {
    if (!rolls || !users) return [];
    
    // Filter by selected user if applicable
    const relevantUsers = selectedUser === 'all' 
      ? users 
      : users.filter(user => user.id === selectedUser);
    
    return relevantUsers.map(user => {
      // Find all rolls associated with this user
      const userRolls = rolls.filter(roll => {
        if (!roll.createdAt || !filterByDateRange(roll.createdAt)) return false;
        return roll.createdById === user.id;
      });
      
      // Calculate metrics
      const totalRolls = userRolls.length;
      const totalQuantity = userRolls.reduce((sum, roll) => sum + (roll.extrudingQty || 0), 0);
      const completedRolls = userRolls.filter(roll => roll.status === 'completed').length;
      const completionRate = totalRolls > 0 ? (completedRolls / totalRolls * 100).toFixed(1) + '%' : '0%';
      
      return {
        id: user.id,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        username: user.username,
        role: user.role || 'User',
        totalRolls,
        totalQuantity,
        completedRolls,
        completionRate,
      };
    })
    .filter(user => user.totalRolls > 0) // Only include users with activity
    .sort((a, b) => b.totalQuantity - a.totalQuantity); // Sort by quantity descending
  };

  // Prepare section-specific report
  const prepareSectionReportData = () => {
    if (!sections) return [];
    
    // Filter by selected section if applicable
    const relevantSections = selectedSection === 'all' 
      ? sections 
      : sections.filter(section => section.id === selectedSection);
    
    return relevantSections.map(section => {
      // In a real implementation, you would connect sections to actual production data
      // This is placeholder data for the example
      
      // Random data for demo purposes
      const totalRolls = Math.floor(Math.random() * 50) + 10;
      const totalQuantity = Math.floor(Math.random() * 5000) + 1000;
      const efficiency = Math.floor(Math.random() * 30) + 70;
      const activeUsers = Math.floor(Math.random() * 5) + 1;
      
      return {
        id: section.id,
        name: section.name,
        description: section.description || 'No description',
        totalRolls,
        totalQuantity,
        efficiency: efficiency + '%',
        activeUsers,
      };
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity); // Sort by quantity descending
  };

  // Prepare data for reports
  const userActivityData = prepareUserActivityData();
  const sectionPerformanceData = prepareSectionPerformanceData();
  const userReportData = prepareUserReportData();
  const sectionReportData = prepareSectionReportData();

  // Report columns
  const userReportColumns = [
    { header: "User", accessorKey: "name" },
    { header: "Username", accessorKey: "username" },
    { header: "Role", accessorKey: "role" },
    { 
      header: "Total Rolls", 
      accessorKey: "totalRolls",
    },
    { 
      header: "Total Quantity (Kg)", 
      accessorKey: "totalQuantity",
      cell: (row: any) => formatNumber(row.totalQuantity, 1)
    },
    { 
      header: "Completed Rolls", 
      accessorKey: "completedRolls",
    },
    { 
      header: "Completion Rate", 
      accessorKey: "completionRate",
    },
  ];

  const sectionReportColumns = [
    { header: "Section", accessorKey: "name" },
    { header: "Description", accessorKey: "description" },
    { 
      header: "Total Rolls", 
      accessorKey: "totalRolls",
    },
    { 
      header: "Total Quantity (Kg)", 
      accessorKey: "totalQuantity",
      cell: (row: any) => formatNumber(row.totalQuantity, 1)
    },
    { 
      header: "Efficiency", 
      accessorKey: "efficiency",
    },
    { 
      header: "Active Users", 
      accessorKey: "activeUsers",
    },
  ];

  // Mobile card view for user reports
  const renderMobileUserCards = () => {
    if (userReportData.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for the selected criteria.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {userReportData.map((user, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">{user.name}</CardTitle>
                <Badge className="bg-blue-100 text-blue-700">{user.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Username</p>
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Rolls</p>
                  <p className="text-sm font-medium">{user.totalRolls}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed Rolls</p>
                  <p className="text-sm font-medium">{user.completedRolls}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                  <p className="text-sm font-medium">{user.completionRate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-sm font-medium">{formatNumber(user.totalQuantity, 1)} Kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Mobile card view for section reports
  const renderMobileSectionCards = () => {
    if (sectionReportData.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for the selected criteria.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {sectionReportData.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 bg-gray-50">
              <CardTitle className="text-base font-medium">{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm font-medium">{section.description}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Rolls</p>
                  <p className="text-sm font-medium">{section.totalRolls}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Efficiency</p>
                  <p className="text-sm font-medium">{section.efficiency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Users</p>
                  <p className="text-sm font-medium">{section.activeUsers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                  <p className="text-sm font-medium">{formatNumber(section.totalQuantity, 1)} Kg</p>
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
          <h1 className="text-2xl font-bold text-secondary-900">User & Section Reports</h1>
          <p className="text-secondary-500">Analyze performance by user and section</p>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <span className="material-icons text-sm mr-1">people</span>
            User Reports
          </TabsTrigger>
          <TabsTrigger value="sections" className="text-xs sm:text-sm">
            <span className="material-icons text-sm mr-1">dashboard</span>
            Section Reports
          </TabsTrigger>
        </TabsList>
        
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
                <label className="block text-sm font-medium mb-1">
                  {activeTab === 'users' ? 'User' : 'Section'}
                </label>
                {activeTab === 'users' ? (
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
                ) : (
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
                )}
              </div>
              
              <div className="col-span-1 sm:col-span-2 md:col-span-2">
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
        
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-blue-500 mb-2">people</span>
                  <p className="text-sm text-secondary-500">Active Users</p>
                  <p className="text-2xl font-bold">{userReportData.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-green-500 mb-2">category</span>
                  <p className="text-sm text-secondary-500">Total Rolls</p>
                  <p className="text-2xl font-bold">
                    {userReportData.reduce((sum, user) => sum + user.totalRolls, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-purple-500 mb-2">inventory</span>
                  <p className="text-sm text-secondary-500">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(userReportData.reduce((sum, user) => sum + user.totalQuantity, 0), 1)} Kg
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-amber-500 mb-2">check_circle</span>
                  <p className="text-sm text-secondary-500">Avg. Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {userReportData.length > 0 
                      ? formatNumber(
                          userReportData.reduce((sum, user) => 
                            sum + parseFloat(user.completionRate), 0) / userReportData.length, 
                          1
                        ) + '%'
                      : '0%'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Production</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {userActivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userActivityData}
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
          
          <Card>
            <CardHeader>
              <CardTitle>User Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                renderMobileUserCards()
              ) : (
                <DataTable 
                  data={userReportData}
                  columns={userReportColumns as any}
                />
              )}
              <div className="mt-4 text-sm text-gray-500">
                Total: {userReportData.length} active users
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sections" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-blue-500 mb-2">dashboard</span>
                  <p className="text-sm text-secondary-500">Active Sections</p>
                  <p className="text-2xl font-bold">{sectionReportData.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-green-500 mb-2">category</span>
                  <p className="text-sm text-secondary-500">Total Rolls</p>
                  <p className="text-2xl font-bold">
                    {sectionReportData.reduce((sum, section) => sum + section.totalRolls, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-purple-500 mb-2">inventory</span>
                  <p className="text-sm text-secondary-500">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(sectionReportData.reduce((sum, section) => sum + section.totalQuantity, 0), 1)} Kg
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <span className="material-icons text-2xl text-amber-500 mb-2">speed</span>
                  <p className="text-sm text-secondary-500">Avg. Efficiency</p>
                  <p className="text-2xl font-bold">
                    {sectionReportData.length > 0 
                      ? formatNumber(
                          sectionReportData.reduce((sum, section) => 
                            sum + parseFloat(section.efficiency), 0) / sectionReportData.length, 
                          1
                        ) + '%'
                      : '0%'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Section Production</CardTitle>
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
          
          <Card>
            <CardHeader>
              <CardTitle>Section Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                renderMobileSectionCards()
              ) : (
                <DataTable 
                  data={sectionReportData}
                  columns={sectionReportColumns as any}
                />
              )}
              <div className="mt-4 text-sm text-gray-500">
                Total: {sectionReportData.length} active sections
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}