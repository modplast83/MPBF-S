import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { 
  AlertTriangle, 
  ClipboardList, 
  FileCheck, 
  FileWarning, 
  MessageSquareWarning, 
  PenTool, 
  ShieldAlert, 
  UserMinus, 
  Sparkles, 
  LayoutDashboard
} from "lucide-react";

export default function QualityIndex() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader heading="Quality Management" text="Monitor and control quality through inspections, violations, and penalties" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow border-purple-200">
          <CardHeader className="pb-3 bg-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Enhanced Quality Module
            </CardTitle>
            <CardDescription>
              Comprehensive quality control with enhanced professional functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access our enhanced quality module with improved interfaces, professional functionality, and mobile optimization.
            </p>
            <Link href="/quality/enhanced-module">
              <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50">Open Enhanced Module</Button>
            </Link>
          </CardContent>
        </Card>
        
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
        
        <Card className="hover:shadow-md transition-shadow border-orange-200">
          <CardHeader className="pb-3 bg-orange-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-600" />
              Violations
            </CardTitle>
            <CardDescription>
              Report and track quality violations during production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Document quality violations, classify by severity, and track resolution status for proper accountability.
            </p>
            <Link href="/quality/violations">
              <Button variant="outline" className="w-full border-orange-200 hover:bg-orange-50">Manage Violations</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-red-200">
          <CardHeader className="pb-3 bg-red-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              Penalties
            </CardTitle>
            <CardDescription>
              Apply penalties for quality violations and monitor compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Assign and track penalties for severe quality violations, including warnings, training, and financial consequences.
            </p>
            <Link href="/quality/penalties">
              <Button variant="outline" className="w-full border-red-200 hover:bg-red-50">Manage Penalties</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-blue-200">
          <CardHeader className="pb-3 bg-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Violation Reports
            </CardTitle>
            <CardDescription>
              Generate and analyze comprehensive quality violation reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create detailed reports on quality violations, identify trends, and track improvement initiatives across production areas.
            </p>
            <Link href="/quality/reports">
              <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50">View Reports</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}