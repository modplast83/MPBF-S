import React, { useEffect, useState } from "react";
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
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

import { CHART_COLORS } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProductionChartProps {
  className?: string;
}

export function ProductionChart({ className }: ProductionChartProps) {
  const [tab, setTab] = useState("daily");
  
  // Simulated production data
  const [dailyData, setDailyData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });
  
  const [monthlyData, setMonthlyData] = useState<ChartData<"bar">>({
    labels: [],
    datasets: [],
  });
  
  useEffect(() => {
    // Generate sample daily data (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    });
    
    setDailyData({
      labels: days,
      datasets: [
        {
          label: "Production Volume (kg)",
          data: [1200, 1350, 980, 1420, 1100, 1500, 1300],
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primaryLight,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: CHART_COLORS.primary,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Efficiency (%)",
          data: [75, 80, 65, 85, 70, 90, 78],
          borderColor: CHART_COLORS.success,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: "y1",
          pointBackgroundColor: "#fff",
          pointBorderColor: CHART_COLORS.success,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    });
    
    // Generate sample monthly data (last 6 months)
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleDateString("en-US", { month: "short" });
    });
    
    setMonthlyData({
      labels: months,
      datasets: [
        {
          label: "Production Volume (kg)",
          data: [28500, 32000, 29800, 35600, 38200, 36500],
          backgroundColor: CHART_COLORS.primaryLight,
          borderColor: CHART_COLORS.primary,
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: CHART_COLORS.primary,
        },
        {
          label: "Completed Orders",
          data: [48, 52, 45, 60, 65, 58],
          backgroundColor: CHART_COLORS.successLight,
          borderColor: CHART_COLORS.success,
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: CHART_COLORS.success,
          yAxisID: "y1",
        },
      ],
    });
  }, []);
  
  const dailyOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Volume (kg)",
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: {
          display: true,
          text: "Efficiency (%)",
        },
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  const monthlyOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Volume (kg)",
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: {
          display: true,
          text: "Orders",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  return (
    <div className={`rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary-600">insights</span>
            <h3 className="font-semibold text-lg text-gray-800">Production Activity</h3>
          </div>
          <div className="flex p-1 bg-gray-100 rounded-lg shadow-sm">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === 'daily' 
                  ? 'bg-white text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:text-primary-600'
              }`}
              onClick={() => setTab("daily")}
            >
              Daily
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === 'monthly' 
                  ? 'bg-white text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:text-primary-600'
              }`}
              onClick={() => setTab("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {tab === "daily" 
            ? "Production output and efficiency over the past week" 
            : "Production volume and completed orders over 6 months"}
        </p>
      </div>
      <div className="p-6 h-80 bg-white">
        {tab === "daily" ? (
          <div className="h-full">
            <Line options={dailyOptions} data={dailyData} />
          </div>
        ) : (
          <div className="h-full">
            <Bar options={monthlyOptions} data={monthlyData} />
          </div>
        )}
      </div>
    </div>
  );
}
