import { Switch, Route } from "wouter";
import Dashboard from "@/pages/dashboard";
import SetupIndex from "@/pages/setup/index";
import Categories from "@/pages/setup/categories";
import Products from "@/pages/setup/products";
import Customers from "@/pages/setup/customers";
import Items from "@/pages/setup/items";
import Sections from "@/pages/setup/sections";
import Machines from "@/pages/setup/machines";
import Users from "@/pages/setup/users";
import OrdersIndex from "@/pages/orders/index";
import OrderDetails from "@/pages/orders/[id]";
import WorkflowIndex from "@/pages/workflow/index";
import WarehouseIndex from "@/pages/warehouse/index";
import RawMaterials from "@/pages/warehouse/raw-materials";
import FinalProducts from "@/pages/warehouse/final-products";
import ReportsIndex from "@/pages/reports/index";
import SystemIndex from "@/pages/system/index";
import Database from "@/pages/system/database";
import Permissions from "@/pages/system/permissions";
import ImportExport from "@/pages/system/import-export";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";

function App() {
  // Initialize demo data when the app loads for the first time
  useEffect(() => {
    // Use localStorage to prevent initialization on every page reload or HMR
    const hasInitialized = localStorage.getItem('demoDataInitialized');
    
    const initializeData = async () => {
      try {
        await apiRequest("POST", API_ENDPOINTS.INIT_DEMO_DATA, {});
        console.log("Demo data initialized successfully");
        // Set flag to prevent reinitializing
        localStorage.setItem('demoDataInitialized', 'true');
      } catch (error) {
        console.error("Failed to initialize demo data:", error);
      }
    };
    
    // Only initialize if it hasn't been done in this session
    if (!hasInitialized) {
      initializeData();
    }
  }, []);

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/setup" component={SetupIndex} />
        <Route path="/setup/categories" component={Categories} />
        <Route path="/setup/products" component={Products} />
        <Route path="/setup/customers" component={Customers} />
        <Route path="/setup/items" component={Items} />
        <Route path="/setup/sections" component={Sections} />
        <Route path="/setup/machines" component={Machines} />
        <Route path="/setup/users" component={Users} />
        <Route path="/orders" component={OrdersIndex} />
        <Route path="/orders/:id" component={OrderDetails} />
        <Route path="/workflow" component={WorkflowIndex} />
        <Route path="/warehouse" component={WarehouseIndex} />
        <Route path="/warehouse/raw-materials" component={RawMaterials} />
        <Route path="/warehouse/final-products" component={FinalProducts} />
        <Route path="/reports" component={ReportsIndex} />
        <Route path="/system" component={SystemIndex} />
        <Route path="/system/database" component={Database} />
        <Route path="/system/permissions" component={Permissions} />
        <Route path="/system/import-export" component={ImportExport} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default App;
