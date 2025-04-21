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
import ProductionIndex from "@/pages/production/index";
import MixMaterialsPage from "@/pages/production/mix-materials";
import WarehouseIndex from "@/pages/warehouse/index";
import RawMaterials from "@/pages/warehouse/raw-materials";
import FinalProducts from "@/pages/warehouse/final-products";
import ReportsIndex from "@/pages/reports/index";
import SystemIndex from "@/pages/system/index";
import Database from "@/pages/system/database";
import Permissions from "@/pages/system/permissions";
import ImportExport from "@/pages/system/import-export";
import SmsIndex from "@/pages/system/sms/index";
import QualityIndex from "@/pages/quality/index";
import QualityCheckTypes from "@/pages/quality/check-types";
import QualityChecks from "@/pages/quality/checks";
import CorrectiveActions from "@/pages/quality/corrective-actions";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useEffect } from "react";
import ToolsPage from "@/pages/tools/ToolsPage";
import BagWeightCalculator from "@/pages/tools/bag-weight";
import InkConsumptionCalculator from "@/pages/tools/ink-consumption";
import UtilityTools from "@/pages/tools/utilities";

function App() {
  // Remove any existing demo data flag
  useEffect(() => {
    localStorage.removeItem('demoDataInitialized');
  }, []);

  return (
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
          <ProtectedRoute path="/production" component={ProductionIndex} />
          <ProtectedRoute path="/production/mix-materials" component={MixMaterialsPage} />
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
          <ProtectedRoute path="/system/sms" component={SmsIndex} />
          <ProtectedRoute path="/tools" component={ToolsPage} />
          <ProtectedRoute path="/tools/bag-weight" component={BagWeightCalculator} />
          <ProtectedRoute path="/tools/ink-consumption" component={InkConsumptionCalculator} />
          <ProtectedRoute path="/tools/utilities" component={UtilityTools} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    </AuthProvider>
  );
}

export default App;
