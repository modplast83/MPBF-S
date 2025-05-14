import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductionChart } from "@/components/dashboard/production-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { ActiveOrdersTable } from "@/components/dashboard/active-orders-table";
import { PerformanceHealth } from "@/components/dashboard/performance-health";
import { Order, Roll, RawMaterial, JobOrder } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer, ResponsiveGrid } from "@/components/ui/responsive-grid";
import { useResponsiveClasses } from "@/lib/mobile-utils";

export default function Dashboard() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
  // Fetch data for dashboard statistics
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: rolls, isLoading: rollsLoading } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  const { data: rawMaterials, isLoading: materialsLoading } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });

  // Calculate statistics
  const totalOrders = orders?.length || 0;
  const processingOrders = orders?.filter(order => order.status === "processing").length || 0;
  const completedOrders = orders?.filter(order => order.status === "completed").length || 0;
  
  const activeRolls = rolls?.filter(roll => roll.status !== "completed").length || 0;
  
  const totalRawMaterial = rawMaterials?.reduce((sum, material) => sum + (material.quantity || 0), 0) || 0;
  
  // Production efficiency (sample calculation)
  const productionEfficiency = 78; // This would be calculated from real data in a full implementation

  // Trend calculations
  const orderTrend = {
    value: t("dashboard.trend_from_last_month", { percent: "12%" }),
    direction: totalOrders > 350 ? "up" : "down",
  } as const;

  const efficiencyTrend = {
    value: t("dashboard.trend_from_last_week", { percent: "3%" }),
    direction: productionEfficiency < 80 ? "down" : "up",
  } as const;

  const rollsTrend = {
    value: t("dashboard.trend_more_than_yesterday", { count: 5 }),
    direction: "up",
  } as const;

  const materialTrend = {
    value: t("dashboard.low_inventory_alert"),
    direction: "down",
  } as const;

  // Use our responsive utility hook
  const responsive = useResponsiveClasses();
  
  return (
    <ResponsiveContainer maxWidth="xl" padding={true} className="space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className={responsive.text("xl", "2xl", "bold") + " text-secondary-900 mb-4 md:mb-6 px-1"}>
        {t("sidebar.dashboard")}
      </h1>
      
      {/* Dashboard Stats */}
      <ResponsiveGrid 
        cols={{ xs: 1, sm: 2, lg: 4 }} 
        gap={{ x: 3, y: 3 }} 
        className={isRTL ? 'rtl' : ''}
      >
        <StatCard
          title={t("dashboard.total_orders")}
          value={totalOrders}
          icon="receipt_long"
          trend={orderTrend}
          iconColor="text-primary-500"
          iconBgColor="bg-primary-50"
          isMobile={isMobile}
        />

        <StatCard
          title={t("dashboard.production_efficiency")}
          value={`${productionEfficiency}%`}
          icon="trending_up"
          trend={efficiencyTrend}
          iconColor="text-success"
          iconBgColor="bg-success-50"
          isMobile={isMobile}
        />

        <StatCard
          title={t("dashboard.active_roll_jobs")}
          value={activeRolls}
          icon="linear_scale"
          trend={rollsTrend}
          iconColor="text-warning-500"
          iconBgColor="bg-warning-50"
          isMobile={isMobile}
        />

        <StatCard
          title={t("dashboard.raw_material_stock")}
          value={`${(totalRawMaterial / 1000).toFixed(1)}T`}
          icon="inventory"
          trend={materialTrend}
          iconColor="text-error-500"
          iconBgColor="bg-error-50"
          isMobile={isMobile}
        />
      </ResponsiveGrid>

      {/* Chart, Health Dashboard and Recent Orders - Responsive layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 ${isRTL ? 'rtl' : ''}`}>
        {/* Production Chart */}
        <div className={`bg-white rounded-lg shadow ${responsive.padding(3, 5)} ${!isMobile ? 'lg:col-span-2' : ''} ${isRTL ? 'rtl' : ''} order-2 lg:order-1`}>
          <h2 className={responsive.text("base", "lg", "medium") + " mb-3 md:mb-4"}>
            {t("dashboard.production_trends")}
          </h2>
          <ProductionChart className={`${isRTL ? 'rtl' : ''}`} />
        </div>

        {/* Performance Health Dashboard */}
        <div className={`order-3 lg:order-2 ${!isMobile ? 'lg:row-span-2' : ''}`}>
          <PerformanceHealth
            orders={orders || []}
            jobOrders={jobOrders || []}
            rolls={rolls || []}
            rawMaterials={rawMaterials || []}
          />
        </div>

        {/* Recent Orders - Display first on mobile */}
        <div className="order-1 lg:order-3">
          <RecentOrders />
        </div>
      </div>

      {/* Active Orders Table */}
      <div className={isRTL ? 'rtl' : ''}>
        <ActiveOrdersTable />
      </div>
    </ResponsiveContainer>
  );
}
