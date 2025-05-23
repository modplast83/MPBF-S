import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { EnhancedViolationManagement } from "@/components/quality/enhanced-violation-management";
import { Card } from "@/components/ui/card";

export default function QualityViolationsEnhanced() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.violations")} 
        description={t("quality.violations_description")}
      />
      
      <div className="mt-6">
        <Card className="p-4 sm:p-6">
          <EnhancedViolationManagement />
        </Card>
      </div>
    </div>
  );
}