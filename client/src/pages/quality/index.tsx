import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.title")} 
        description={t("quality.description", "Monitor and control quality through inspections, violations, and penalties")} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow border-purple-200">
          <CardHeader className="pb-3 bg-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {t("quality.unified_dashboard")}
            </CardTitle>
            <CardDescription>
              {t("quality.unified_dashboard_desc", "All-in-one quality control dashboard")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.unified_dashboard_details", "Access all quality management features in a professional, mobile-optimized interface.")}
            </p>
            <Link href="/quality/unified-dashboard">
              <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50">
                {t("quality.open_dashboard")}
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {t("quality.check_types")}
            </CardTitle>
            <CardDescription>
              {t("quality.check_types_desc", "Define quality check templates for different stages")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.check_types_details", "Create standardized check types with parameters and checklists tailored to each production stage.")}
            </p>
            <Link href="/quality/check-types">
              <Button variant="outline" className="w-full">
                {t("quality.manage_check_types")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {t("quality.quality_checks")}
            </CardTitle>
            <CardDescription>
              {t("quality.checks_desc", "Perform and track quality inspections")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.checks_details", "Record quality checks at different production stages to ensure product meets specifications.")}
            </p>
            <Link href="/quality/checks">
              <Button variant="outline" className="w-full">
                {t("quality.view_checks")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              {t("quality.corrective_actions")}
            </CardTitle>
            <CardDescription>
              {t("quality.actions_desc", "Track and resolve quality issues")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.actions_details", "Assign, monitor, and verify corrective actions to address quality issues and prevent recurrence.")}
            </p>
            <Link href="/quality/corrective-actions">
              <Button variant="outline" className="w-full">
                {t("quality.manage_actions")}
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-orange-200">
          <CardHeader className="pb-3 bg-orange-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-600" />
              {t("quality.violations")}
            </CardTitle>
            <CardDescription>
              {t("quality.violations_desc", "Report and track quality violations")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.violations_details", "Document quality violations, classify by severity, and track resolution status for proper accountability.")}
            </p>
            <Link href="/quality/violations">
              <Button variant="outline" className="w-full border-orange-200 hover:bg-orange-50">
                {t("quality.manage_violations")}
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-red-200">
          <CardHeader className="pb-3 bg-red-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              {t("quality.penalties")}
            </CardTitle>
            <CardDescription>
              {t("quality.penalties_desc", "Apply penalties for quality violations")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.penalties_details", "Assign and track penalties for severe quality violations, including warnings, training, and financial consequences.")}
            </p>
            <Link href="/quality/penalties">
              <Button variant="outline" className="w-full border-red-200 hover:bg-red-50">
                {t("quality.manage_penalties")}
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-blue-200">
          <CardHeader className="pb-3 bg-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              {t("quality.reports")}
            </CardTitle>
            <CardDescription>
              {t("quality.reports_desc", "Generate quality violation reports")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quality.reports_details", "Create detailed reports on quality violations, identify trends, and track improvement initiatives across production areas.")}
            </p>
            <Link href="/quality/reports">
              <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50">
                {t("quality.view_reports")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}