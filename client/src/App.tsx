import { Route, Switch } from "wouter";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import SimpleLogin from "@/pages/SimpleLogin";
import Sidebar from "@/components/layout/sidebar";
import Setup from "@/pages/setup";
import WorkflowPage from "@/pages/workflow";
import { SimpleProtectedRoute } from "@/components/auth/simple-protected-route";
import { SimpleProtectedRouteWrapper } from "@/components/auth/simple-protected-route-wrapper";
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
      <ProtectedRouteWrapper>
        <Sidebar />
      </ProtectedRouteWrapper>
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/login" component={SimpleLogin} />
          <Route path="/auth" component={SimpleLogin} />
          
          {/* Main dashboard */}
          <Route path="/">
            <ProtectedRouteWrapper>
              <Dashboard />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Setup section */}
          <Route path="/setup">
            <ProtectedRouteWrapper requiredModules={["Setup"]}>
              <Setup />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/products">
            <ProtectedRouteWrapper requiredModules={["Products"]}>
              <Products />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/customers">
            <ProtectedRouteWrapper requiredModules={["Customers"]}>
              <Customers />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/categories">
            <ProtectedRouteWrapper requiredModules={["Categories"]}>
              <Categories />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/items">
            <ProtectedRouteWrapper requiredModules={["Items"]}>
              <Items />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/sections">
            <ProtectedRouteWrapper requiredModules={["Sections"]}>
              <Sections />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/users">
            <ProtectedRouteWrapper requiredModules={["Users"]}>
              <Users />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/setup/machines">
            <ProtectedRouteWrapper requiredModules={["Machines"]}>
              <Machines />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Orders */}
          <Route path="/orders">
            <ProtectedRouteWrapper requiredModules={["Orders"]}>
              <Orders />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Workflow */}
          <Route path="/workflow">
            <ProtectedRouteWrapper requiredModules={["Workflow"]}>
              <WorkflowPage />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Production */}
          <Route path="/production">
            <ProtectedRouteWrapper requiredModules={["Production"]}>
              <ProductionPage />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/production/mix-materials">
            <ProtectedRouteWrapper requiredModules={["Mix Materials"]}>
              <MixMaterials />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Warehouse */}
          <Route path="/warehouse">
            <ProtectedRouteWrapper requiredModules={["Warehouse"]}>
              <WarehousePage />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/warehouse/raw-materials">
            <ProtectedRouteWrapper requiredModules={["Raw Materials"]}>
              <RawMaterials />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/warehouse/final-products">
            <ProtectedRouteWrapper requiredModules={["Final Products"]}>
              <FinalProducts />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Quality */}
          <Route path="/quality">
            <ProtectedRouteWrapper requiredModules={["Quality"]}>
              <QualityPage />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/quality/check-types">
            <ProtectedRouteWrapper requiredModules={["Check Types"]}>
              <QualityCheckTypes />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/quality/checks">
            <ProtectedRouteWrapper requiredModules={["Checks"]}>
              <QualityChecks />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/quality/violations">
            <ProtectedRouteWrapper requiredModules={["Violations"]}>
              <QualityViolations />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/quality/corrective-actions">
            <ProtectedRouteWrapper requiredModules={["Corrective Actions"]}>
              <CorrectiveActions />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/quality/penalties">
            <ProtectedRouteWrapper requiredModules={["Penalties"]}>
              <QualityPenalties />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Maintenance */}
          <Route path="/maintenance">
            <ProtectedRouteWrapper requiredModules={["Maintenance"]}>
              <MaintenanceDashboard />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/maintenance/requests">
            <ProtectedRouteWrapper requiredModules={["Maintenance"]}>
              <MaintenanceRequests />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Reports */}
          <Route path="/reports">
            <ProtectedRouteWrapper requiredModules={["Reports"]}>
              <ReportsPage />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Tools */}
          <Route path="/tools">
            <ProtectedRouteWrapper requiredModules={["Tools"]}>
              <ToolsPage />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Cliches */}
          <Route path="/cliches">
            <ProtectedRouteWrapper requiredModules={["Cliches"]}>
              <ClichesPage />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* System settings */}
          <Route path="/system/permissions">
            <ProtectedRouteWrapper requiredModules={["Permissions"]}>
              <Permissions />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/system/database">
            <ProtectedRouteWrapper requiredModules={["Database"]}>
              <DatabasePage />
            </ProtectedRouteWrapper>
          </Route>
          
          <Route path="/system/sms">
            <ProtectedRouteWrapper requiredModules={["SMS Management"]}>
              <SMSManagement />
            </ProtectedRouteWrapper>
          </Route>
          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}