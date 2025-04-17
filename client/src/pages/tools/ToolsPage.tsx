import { Link } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Droplet, Wrench } from "lucide-react";

export default function ToolsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        heading="Factory Tools" 
        text="Specialized tools to help with factory calculations and operations"
      >
        <Wrench className="h-6 w-6 mb-2" />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/tools/bag-weight">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Bag Weight Calculator
              </CardTitle>
              <CardDescription>
                Calculate the theoretical weight of plastic bags based on dimensions and material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Precisely calculate the weight of plastic bags by specifying dimensions, 
                thickness, material density, and other parameters.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tools/ink-consumption">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Droplet className="mr-2 h-5 w-5" />
                Ink Consumption Calculator
              </CardTitle>
              <CardDescription>
                Estimate ink usage for flexographic printing jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Calculate the amount of ink needed for print jobs based on coverage area,
                print density, anilox specification, and other printing parameters.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tools/utilities">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Wrench className="mr-2 h-5 w-5" />
                Utility Tools
              </CardTitle>
              <CardDescription>
                Additional utilities for daily operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Access various utility tools including unit converters, 
                process time estimators, and other helpful calculators.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}