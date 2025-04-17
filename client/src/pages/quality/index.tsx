import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ClipboardList, FileCheck, ShieldAlert } from "lucide-react";

export default function QualityIndex() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Quality Management" text="Monitor and control quality through inspections and corrective actions" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Check Types
            </CardTitle>
            <CardDescription>
              Define quality check templates for different production stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create standardized check types with parameters and checklists tailored to each production stage.
            </p>
            <Link href="/quality/check-types">
              <Button variant="outline" className="w-full">Manage Check Types</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Quality Checks
            </CardTitle>
            <CardDescription>
              Perform and track quality inspections on rolls and job orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Record quality checks at different production stages to ensure product meets specifications.
            </p>
            <Link href="/quality/checks">
              <Button variant="outline" className="w-full">View Quality Checks</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Corrective Actions
            </CardTitle>
            <CardDescription>
              Track and resolve issues identified during quality checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Assign, monitor, and verify corrective actions to address quality issues and prevent recurrence.
            </p>
            <Link href="/quality/corrective-actions">
              <Button variant="outline" className="w-full">Manage Corrective Actions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}