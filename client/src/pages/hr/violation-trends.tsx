import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Users, BarChart3, PieChart } from "lucide-react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import type { HrViolation } from "@shared/schema";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ViolationTrendsPage() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("total");

  // Get violations data
  const { data: violations = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.HR_VIOLATIONS],
    queryFn: () => apiRequest('GET', API_ENDPOINTS.HR_VIOLATIONS)
  });

  // Process data for different time ranges
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "3months":
        return { start: subMonths(now, 3), end: now };
      case "6months":
        return { start: subMonths(now, 6), end: now };
      case "12months":
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subMonths(now, 6), end: now };
    }
  };

  const { start, end } = getDateRange();
  const filteredViolations = violations.filter((v: HrViolation) => {
    const reportDate = new Date(v.reportDate);
    return reportDate >= start && reportDate <= end;
  });

  // Generate monthly data points
  const generateMonthlyData = () => {
    const months = [];
    const current = new Date(start);
    
    while (current <= end) {
      months.push({
        month: format(current, 'yyyy-MM'),
        label: format(current, 'MMM yyyy')
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months.map(({ month, label }) => {
      const monthViolations = filteredViolations.filter((v: HrViolation) => 
        format(new Date(v.reportDate), 'yyyy-MM') === month
      );

      return {
        month: label,
        total: monthViolations.length,
        minor: monthViolations.filter((v: HrViolation) => v.severity === 'minor').length,
        major: monthViolations.filter((v: HrViolation) => v.severity === 'major').length,
        critical: monthViolations.filter((v: HrViolation) => v.severity === 'critical').length,
        attendance: monthViolations.filter((v: HrViolation) => v.violationType === 'attendance').length,
        conduct: monthViolations.filter((v: HrViolation) => v.violationType === 'conduct').length,
        safety: monthViolations.filter((v: HrViolation) => v.violationType === 'safety').length,
        performance: monthViolations.filter((v: HrViolation) => v.violationType === 'performance').length,
        policy: monthViolations.filter((v: HrViolation) => v.violationType === 'policy').length,
      };
    });
  };

  const monthlyData = generateMonthlyData();

  // Chart configurations
  const lineChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Total Violations',
        data: monthlyData.map(d => d.total),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Critical',
        data: monthlyData.map(d => d.critical),
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Major',
        data: monthlyData.map(d => d.major),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Minor',
        data: monthlyData.map(d => d.minor),
        borderColor: 'rgb(250, 204, 21)',
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const barChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Attendance',
        data: monthlyData.map(d => d.attendance),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'Conduct',
        data: monthlyData.map(d => d.conduct),
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
      },
      {
        label: 'Safety',
        data: monthlyData.map(d => d.safety),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
      },
      {
        label: 'Performance',
        data: monthlyData.map(d => d.performance),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Policy',
        data: monthlyData.map(d => d.policy),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
      }
    ]
  };

  // Severity distribution
  const severityData = {
    labels: ['Minor', 'Major', 'Critical'],
    datasets: [{
      data: [
        filteredViolations.filter((v: HrViolation) => v.severity === 'minor').length,
        filteredViolations.filter((v: HrViolation) => v.severity === 'major').length,
        filteredViolations.filter((v: HrViolation) => v.severity === 'critical').length,
      ],
      backgroundColor: [
        'rgba(250, 204, 21, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(220, 38, 38, 0.8)',
      ],
      borderWidth: 2,
    }]
  };

  // Type distribution
  const typeData = {
    labels: ['Attendance', 'Conduct', 'Safety', 'Performance', 'Policy'],
    datasets: [{
      data: [
        filteredViolations.filter((v: HrViolation) => v.violationType === 'attendance').length,
        filteredViolations.filter((v: HrViolation) => v.violationType === 'conduct').length,
        filteredViolations.filter((v: HrViolation) => v.violationType === 'safety').length,
        filteredViolations.filter((v: HrViolation) => v.violationType === 'performance').length,
        filteredViolations.filter((v: HrViolation) => v.violationType === 'policy').length,
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(147, 51, 234, 0.8)',
      ],
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // Calculate statistics
  const totalViolations = filteredViolations.length;
  const previousPeriod = violations.filter((v: HrViolation) => {
    const reportDate = new Date(v.reportDate);
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - (timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12));
    return reportDate >= prevStart && reportDate < start;
  });
  
  const trend = totalViolations - previousPeriod.length;
  const trendPercentage = previousPeriod.length > 0 ? ((trend / previousPeriod.length) * 100).toFixed(1) : '0';

  const mostCommonType = Object.entries({
    attendance: filteredViolations.filter((v: HrViolation) => v.violationType === 'attendance').length,
    conduct: filteredViolations.filter((v: HrViolation) => v.violationType === 'conduct').length,
    safety: filteredViolations.filter((v: HrViolation) => v.violationType === 'safety').length,
    performance: filteredViolations.filter((v: HrViolation) => v.violationType === 'performance').length,
    policy: filteredViolations.filter((v: HrViolation) => v.violationType === 'policy').length,
  }).reduce((a, b) => a[1] > b[1] ? a : b);

  const criticalViolations = filteredViolations.filter((v: HrViolation) => v.severity === 'critical').length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("hr.violations.trends.title")}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{t("hr.violations.trends.description")}</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalViolations}</div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className={trend >= 0 ? "text-red-500" : "text-green-500"}>
                {Math.abs(Number(trendPercentage))}%
              </span>
              <span className="ml-1 hidden sm:inline">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalViolations}</div>
            <p className="text-xs text-gray-600 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{mostCommonType[0]}</div>
            <p className="text-xs text-gray-600 mt-1">
              {mostCommonType[1]} incidents ({((mostCommonType[1] / totalViolations) * 100).toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalViolations > 0 ? 
                (((filteredViolations.filter((v: HrViolation) => v.status === 'resolved').length / totalViolations) * 100).toFixed(0)) + '%'
                : '0%'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {filteredViolations.filter((v: HrViolation) => v.status === 'resolved').length} resolved cases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Violation Trends by Severity
            </CardTitle>
            <CardDescription>
              Monthly breakdown of violations by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Violations by Type
            </CardTitle>
            <CardDescription>
              Monthly distribution of violation types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Severity Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of violations by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={severityData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Type Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of violations by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={typeData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trends Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Automated analysis of violation trends and patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trend > 0 && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Increasing Trend
                </div>
                <p className="text-sm text-red-600">
                  Violations have increased by {Math.abs(Number(trendPercentage))}% compared to the previous period. 
                  Consider reviewing current policies and training programs.
                </p>
              </div>
            )}

            {criticalViolations > 0 && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Violations
                </div>
                <p className="text-sm text-red-600">
                  {criticalViolations} critical violations require immediate attention and follow-up actions.
                </p>
              </div>
            )}

            {mostCommonType[1] > totalViolations * 0.3 && (
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                  <BarChart3 className="h-4 w-4" />
                  Pattern Detected
                </div>
                <p className="text-sm text-yellow-600">
                  {mostCommonType[0]} violations account for {((mostCommonType[1] / totalViolations) * 100).toFixed(0)}% of all cases. 
                  Consider targeted training for this area.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}