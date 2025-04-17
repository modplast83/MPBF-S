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
import SmsManagement from "@/pages/system/sms-management";
import QualityIndex from "@/pages/quality/index";
import QualityCheckTypes from "@/pages/quality/check-types";
import QualityChecks from "@/pages/quality/checks";
import CorrectiveActions from "@/pages/quality/corrective-actions";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/setup" component={SetupIndex} />
            <ProtectedRoute path="/setup/categories" component={Categories} />
            <ProtectedRoute path="/setup/products" component={Products} />
            <ProtectedRoute path="/setup/customers" component={Customers} />
            <ProtectedRoute path="/setup/items" component={Items} />
            <ProtectedRoute path="/setup/sections" component={Sections} />
            <ProtectedRoute path="/setup/machines" component={Machines} />
            <ProtectedRoute path="/setup/users" component={Users} />
            <ProtectedRoute path="/orders" component={OrdersIndex} />
            <ProtectedRoute path="/orders/:id" component={OrderDetails} />
            <ProtectedRoute path="/workflow" component={WorkflowIndex} />
            <ProtectedRoute path="/warehouse" component={WarehouseIndex} />
            <ProtectedRoute path="/warehouse/raw-materials" component={RawMaterials} />
            <ProtectedRoute path="/warehouse/final-products" component={FinalProducts} />
            <ProtectedRoute path="/reports" component={ReportsIndex} />
            <ProtectedRoute path="/quality" component={QualityIndex} />
            <ProtectedRoute path="/quality/check-types" component={QualityCheckTypes} />
            <ProtectedRoute path="/quality/checks" component={QualityChecks} />
            <ProtectedRoute path="/quality/corrective-actions" component={CorrectiveActions} />
            <ProtectedRoute path="/system" component={SystemIndex} />
            <ProtectedRoute path="/system/database" component={Database} />
            <ProtectedRoute path="/system/permissions" component={Permissions} />
            <ProtectedRoute path="/system/import-export" component={ImportExport} />
            <ProtectedRoute path="/system/sms-management" component={SmsManagement} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
