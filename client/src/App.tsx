import { Route, Switch } from "wouter";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/layout/sidebar";
import Setup from "@/pages/setup";
import WorkflowPage from "@/pages/workflow";
import { ProtectedRouteWrapper } from "@/components/auth/protected-route-wrapper";
import Products from "@/pages/setup/products";
import Customers from "@/pages/setup/customers";
import Categories from "@/pages/setup/categories";
import Items from "@/pages/setup/items";
import Sections from "@/pages/setup/sections";
import Users from "@/pages/setup/users";
import Machines from "@/pages/setup/machines";
import Orders from "@/pages/orders";
import WarehousePage from "@/pages/warehouse";
import ReportsPage from "@/pages/reports";
import RawMaterials from "@/pages/warehouse/raw-materials";
import FinalProducts from "@/pages/warehouse/final-products";
import QualityPage from "@/pages/quality";
import QualityCheckTypes from "@/pages/quality/check-types";
import QualityChecks from "@/pages/quality/checks";
import QualityViolations from "@/pages/quality/violations";
import CorrectiveActions from "@/pages/quality/corrective-actions";
import QualityPenalties from "@/pages/quality/penalties";
import Permissions from "@/pages/system/permissions";
import DatabasePage from "@/pages/system/database";
import ClichesPage from "@/pages/cliches";
import ToolsPage from "@/pages/tools";
import SMSManagement from "@/pages/system/sms";
import MixMaterials from "@/pages/production/mix-materials";
import ProductionPage from "@/pages/production";
import MaintenanceDashboard from "@/pages/maintenance";
import MaintenanceRequests from "@/pages/maintenance/requests";

export default function App() {
  return (
    <div className="flex h-screen">
      <ProtectedRoute>
        <Sidebar />
      </ProtectedRoute>
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/login" component={AuthPage} />
          
          {/* Main dashboard */}
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          {/* Setup section */}
          <Route path="/setup">
            <ProtectedRoute requiredModules={["Setup"]}>
              <Setup />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/products">
            <ProtectedRoute requiredModules={["Products"]}>
              <Products />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/customers">
            <ProtectedRoute requiredModules={["Customers"]}>
              <Customers />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/categories">
            <ProtectedRoute requiredModules={["Categories"]}>
              <Categories />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/items">
            <ProtectedRoute requiredModules={["Items"]}>
              <Items />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/sections">
            <ProtectedRoute requiredModules={["Sections"]}>
              <Sections />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/users">
            <ProtectedRoute requiredModules={["Users"]}>
              <Users />
            </ProtectedRoute>
          </Route>
          
          <Route path="/setup/machines">
            <ProtectedRoute requiredModules={["Machines"]}>
              <Machines />
            </ProtectedRoute>
          </Route>
          
          {/* Orders */}
          <Route path="/orders">
            <ProtectedRoute requiredModules={["Orders"]}>
              <Orders />
            </ProtectedRoute>
          </Route>
          
          {/* Workflow */}
          <Route path="/workflow">
            <ProtectedRoute requiredModules={["Workflow"]}>
              <WorkflowPage />
            </ProtectedRoute>
          </Route>
          
          {/* Production */}
          <Route path="/production">
            <ProtectedRoute requiredModules={["Production"]}>
              <ProductionPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/production/mix-materials">
            <ProtectedRoute requiredModules={["Mix Materials"]}>
              <MixMaterials />
            </ProtectedRoute>
          </Route>
          
          {/* Warehouse */}
          <Route path="/warehouse">
            <ProtectedRoute requiredModules={["Warehouse"]}>
              <WarehousePage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/warehouse/raw-materials">
            <ProtectedRoute requiredModules={["Raw Materials"]}>
              <RawMaterials />
            </ProtectedRoute>
          </Route>
          
          <Route path="/warehouse/final-products">
            <ProtectedRoute requiredModules={["Final Products"]}>
              <FinalProducts />
            </ProtectedRoute>
          </Route>
          
          {/* Quality */}
          <Route path="/quality">
            <ProtectedRoute requiredModules={["Quality"]}>
              <QualityPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/quality/check-types">
            <ProtectedRoute requiredModules={["Check Types"]}>
              <QualityCheckTypes />
            </ProtectedRoute>
          </Route>
          
          <Route path="/quality/checks">
            <ProtectedRoute requiredModules={["Checks"]}>
              <QualityChecks />
            </ProtectedRoute>
          </Route>
          
          <Route path="/quality/violations">
            <ProtectedRoute requiredModules={["Violations"]}>
              <QualityViolations />
            </ProtectedRoute>
          </Route>
          
          <Route path="/quality/corrective-actions">
            <ProtectedRoute requiredModules={["Corrective Actions"]}>
              <CorrectiveActions />
            </ProtectedRoute>
          </Route>
          
          <Route path="/quality/penalties">
            <ProtectedRoute requiredModules={["Penalties"]}>
              <QualityPenalties />
            </ProtectedRoute>
          </Route>
          
          {/* Maintenance */}
          <Route path="/maintenance">
            <ProtectedRoute requiredModules={["Maintenance"]}>
              <MaintenanceDashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/maintenance/requests">
            <ProtectedRoute requiredModules={["Maintenance"]}>
              <MaintenanceRequests />
            </ProtectedRoute>
          </Route>
          
          {/* Reports */}
          <Route path="/reports">
            <ProtectedRoute requiredModules={["Reports"]}>
              <ReportsPage />
            </ProtectedRoute>
          </Route>
          
          {/* Tools */}
          <Route path="/tools">
            <ProtectedRoute requiredModules={["Tools"]}>
              <ToolsPage />
            </ProtectedRoute>
          </Route>
          
          {/* Cliches */}
          <Route path="/cliches">
            <ProtectedRoute requiredModules={["Cliches"]}>
              <ClichesPage />
            </ProtectedRoute>
          </Route>
          
          {/* System settings */}
          <Route path="/system/permissions">
            <ProtectedRoute requiredModules={["Permissions"]}>
              <Permissions />
            </ProtectedRoute>
          </Route>
          
          <Route path="/system/database">
            <ProtectedRoute requiredModules={["Database"]}>
              <DatabasePage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/system/sms">
            <ProtectedRoute requiredModules={["SMS Management"]}>
              <SMSManagement />
            </ProtectedRoute>
          </Route>
          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}