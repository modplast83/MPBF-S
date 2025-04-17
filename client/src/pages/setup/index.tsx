import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SetupCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
  count: number;
}

function SetupCard({ title, description, icon, path, count }: SetupCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <Link href={path}>
        <a className="block h-full">
          <CardHeader className="bg-primary-50 border-b pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="material-icons text-primary-500 mr-2">{icon}</span>
                {title}
              </span>
              <span className="text-sm bg-primary-100 text-primary-700 rounded-full px-2 py-0.5">
                {count}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">{description}</p>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-700">
                Manage 
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Button>
            </div>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}

export default function SetupIndex() {
  // In a real application, these counts would come from API queries
  const [setupModules] = useState([
    {
      title: "Categories",
      description: "Manage product categories for organization",
      icon: "category",
      path: "/setup/categories",
      count: 5
    },
    {
      title: "Products",
      description: "Manage customer-specific product specifications",
      icon: "inventory_2",
      path: "/setup/products",
      count: 24
    },
    {
      title: "Customers",
      description: "Manage customer information and relationships",
      icon: "people",
      path: "/setup/customers",
      count: 12
    },
    {
      title: "Items",
      description: "Manage product items and details",
      icon: "shopping_bag",
      path: "/setup/items",
      count: 37
    },
    {
      title: "Sections",
      description: "Manage factory production sections",
      icon: "dashboard_customize",
      path: "/setup/sections",
      count: 3
    },
    {
      title: "Machines",
      description: "Manage production machinery and equipment",
      icon: "precision_manufacturing",
      path: "/setup/machines",
      count: 8
    },
    {
      title: "Users",
      description: "Manage system users and permissions",
      icon: "person",
      path: "/setup/users",
      count: 6
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">System Setup</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {setupModules.map((module) => (
          <SetupCard
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            path={module.path}
            count={module.count}
          />
        ))}
      </div>
    </div>
  );
}
