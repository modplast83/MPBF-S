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
import PerformancePage from "@/pages/reports/performance";
import ProductionReportsPage from "@/pages/reports/production";
import WarehouseReportsPage from "@/pages/reports/warehouse";
import QualityReportsPage from "@/pages/reports/quality";
import WorkflowReportsPage from "@/pages/reports/workflow";
import SystemIndex from "@/pages/system/index";
// Quality Module imports
import QualityIndex from "@/pages/quality/index";
import QualityCheckTypes from "@/pages/quality/check-types";
import QualityChecks from "@/pages/quality/checks";
import QualityReports from "@/pages/quality/reports";
import QualityViolations from "@/pages/quality/violations";
import QualityPenalties from "@/pages/quality/penalties";
import QualityCorrectiveActions from "@/pages/quality/corrective-actions";
import UnifiedQualityDashboard from "@/pages/quality/unified-dashboard";
import Database from "@/pages/system/database";
import Permissions from "@/pages/system/permissions-fixed";
import ImportExport from "@/pages/system/import-export";
import SmsIndex from "@/pages/system/sms/index";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import { AuthProvider } from "@/hooks/use-auth-v2";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useEffect } from "react";
import ToolsPage from "@/pages/tools/ToolsPage";
import BagWeightCalculator from "@/pages/tools/bag-weight";
import InkConsumptionCalculator from "@/pages/tools/ink-consumption";
import UtilityTools from "@/pages/tools/utilities";
import CostCalculatorPage from "@/pages/tools/cost-calculator";
import MixColorsCalculator from "@/pages/tools/mix-colors";
import ClichePage from "@/pages/cliches/index";
import { User } from "@shared/schema";

function App() {
  // Remove any existing demo data flag
  useEffect(() => {
    localStorage.removeItem('demoDataInitialized');
  }, []);

  return (
    <AuthProvider>
      {(authContext) => (
        <PermissionsProvider user={authContext.user}>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="*">
              <MainLayout>
                <Switch>
                  <ProtectedRoute path="/" component={Dashboard} />
                  <ProtectedRoute path="/setup" component={SetupIndex} module="Setup" />
                  <ProtectedRoute path="/setup/categories" component={Categories} module="Categories" />
                  <ProtectedRoute path="/setup/products" component={Products} module="Products" />
                  <ProtectedRoute path="/setup/customers" component={Customers} module="Customers" />
                  <ProtectedRoute path="/setup/items" component={Items} module="Items" />
                  <ProtectedRoute path="/setup/sections" component={Sections} module="Sections" />
                  <ProtectedRoute path="/setup/machines" component={Machines} module="Machines" />
                  <ProtectedRoute path="/setup/users" component={Users} module="Users" />
                  <ProtectedRoute path="/production" component={ProductionIndex} module="Production" />
                  <ProtectedRoute path="/production/mix-materials" component={MixMaterialsPage} module="Mix Materials" sectionOnly={true} />
                  <ProtectedRoute path="/orders" component={OrdersIndex} module="Orders" />
                  <ProtectedRoute path="/orders/:id" component={OrderDetails} module="Orders" />
                  <ProtectedRoute path="/workflow" component={WorkflowIndex} module="Workflow" workflowTab="extrusion" />
                  <ProtectedRoute path="/warehouse" component={WarehouseIndex} module="Warehouse" />
                  <ProtectedRoute path="/warehouse/raw-materials" component={RawMaterials} module="Raw Materials" />
                  <ProtectedRoute path="/warehouse/final-products" component={FinalProducts} module="Final Products" />
                  <ProtectedRoute path="/reports" component={ReportsIndex} module="Reports" />
                  <ProtectedRoute path="/reports/performance" component={PerformancePage} module="Performance Metrics" />
                  <ProtectedRoute path="/reports/production" component={ProductionReportsPage} module="Production Reports" />
                  <ProtectedRoute path="/reports/warehouse" component={WarehouseReportsPage} module="Warehouse Reports" />
                  <ProtectedRoute path="/reports/quality" component={QualityReportsPage} module="Quality Reports" />
                  <ProtectedRoute path="/reports/workflow" component={WorkflowReportsPage} module="Workflow Reports" />
                  <ProtectedRoute path="/quality" component={QualityIndex} module="Quality" />
                  <ProtectedRoute path="/quality/unified-dashboard" component={UnifiedQualityDashboard} module="Quality" />
                  <ProtectedRoute path="/quality/check-types" component={QualityCheckTypes} module="Check Types" />
                  <ProtectedRoute path="/quality/checks" component={QualityChecks} module="Checks" />
                  <ProtectedRoute path="/quality/violations" component={QualityViolations} module="Violations" />
                  <ProtectedRoute path="/quality/corrective-actions" component={QualityCorrectiveActions} module="Corrective Actions" />
                  <ProtectedRoute path="/quality/penalties" component={QualityPenalties} module="Penalties" />
                  <ProtectedRoute path="/quality/reports" component={QualityReports} module="Quality Reports" />
                  <ProtectedRoute path="/system" component={SystemIndex} module="System Settings" />
                  <ProtectedRoute path="/system/database" component={Database} module="Database" />
                  <ProtectedRoute path="/system/permissions" component={Permissions} module="Permissions" />
                  <ProtectedRoute path="/system/import-export" component={ImportExport} module="Import & Export" />
                  <ProtectedRoute path="/system/sms" component={SmsIndex} module="SMS Management" />
                  <ProtectedRoute path="/tools" component={ToolsPage} module="Tools" />
                  <ProtectedRoute path="/tools/bag-weight" component={BagWeightCalculator} module="Bag Weight Calculator" />
                  <ProtectedRoute path="/tools/ink-consumption" component={InkConsumptionCalculator} module="Ink Consumption" />
                  <ProtectedRoute path="/tools/utilities" component={UtilityTools} module="Utility Tools" />
                  <ProtectedRoute path="/tools/cost-calculator" component={CostCalculatorPage} module="Cost Calculator" />
                  <ProtectedRoute path="/tools/mix-colors" component={MixColorsCalculator} module="Mix Colors" />
                  <ProtectedRoute path="/cliches" component={ClichePage} module="Cliches" />
                  <Route component={NotFound} />
                </Switch>
              </MainLayout>
            </Route>
          </Switch>
        </PermissionsProvider>
      )}
    </AuthProvider>
  );
}

export default App;
