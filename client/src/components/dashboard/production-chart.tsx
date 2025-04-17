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
          backgroundColor: "rgba(25, 118, 210, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Efficiency (%)",
          data: [75, 80, 65, 85, 70, 90, 78],
          borderColor: CHART_COLORS.success,
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: "y1",
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
          backgroundColor: CHART_COLORS.primary,
        },
        {
          label: "Completed Orders",
          data: [48, 52, 45, 60, 65, 58],
          backgroundColor: CHART_COLORS.success,
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
    <div className={className}>
      <div className="p-6 border-b border-secondary-100">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Production Activity</h3>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-md text-sm font-medium ${tab === 'daily' ? 'bg-primary text-white' : 'bg-secondary-100'}`}
              onClick={() => setTab("daily")}
            >
              Daily
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm font-medium ${tab === 'monthly' ? 'bg-primary text-white' : 'bg-secondary-100'}`}
              onClick={() => setTab("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
      <div className="p-6 h-80">
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
