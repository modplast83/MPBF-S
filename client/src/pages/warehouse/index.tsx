import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface WarehouseCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
  count: number;
  status: "normal" | "warning" | "critical";
}

function WarehouseCard({ title, description, icon, path, count, status }: WarehouseCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "critical":
        return "bg-error-100 text-error-700";
      case "warning":
        return "bg-warning-100 text-warning-700";
      default:
        return "bg-success-100 text-success-700";
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center">
            <span className={`material-icons mr-2 ${status === "critical" ? "text-error-500" : status === "warning" ? "text-warning-500" : "text-success"}`}>
              {icon}
            </span>
            {title}
          </span>
          <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusColor()}`}>
            {count} items
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mt-2">
          <div className="w-full bg-secondary-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${status === "critical" ? "bg-error-500" : status === "warning" ? "bg-warning-500" : "bg-success"}`}
              style={{
                width: status === "critical" ? "15%" : status === "warning" ? "45%" : "85%",
              }}
            ></div>
          </div>
          <p className="text-xs text-secondary-500 mt-1">
            {status === "critical"
              ? "Low stock - Needs immediate attention"
              : status === "warning"
              ? "Moderate stock - Consider reordering"
              : "Good stock level"}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={path}>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-700">
            Manage 
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function WarehouseIndex() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Warehouse</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WarehouseCard
          title="Raw Materials"
          description="Manage raw materials inventory for production"
          icon="inventory"
          path="/warehouse/raw-materials"
          count={12}
          status="warning"
        />
        
        <WarehouseCard
          title="Final Products"
          description="Track and manage finished products inventory"
          icon="inventory_2"
          path="/warehouse/final-products"
          count={245}
          status="normal"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-warning-500">add_circle</span>
                <div>
                  <p className="font-medium">HDPE Raw Material Added</p>
                  <p className="text-sm text-secondary-500">500 kg added to inventory</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Today, 15:30</p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-success">check_circle</span>
                <div>
                  <p className="font-medium">Final Products Stocked</p>
                  <p className="text-sm text-secondary-500">Order #2 products moved to warehouse</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Yesterday, 09:45</p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-error-500">remove_circle</span>
                <div>
                  <p className="font-medium">Raw Material Used</p>
                  <p className="text-sm text-secondary-500">200 kg of HDPE used for Order #3</p>
                </div>
              </div>
              <p className="text-xs text-secondary-500">Apr 15, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
