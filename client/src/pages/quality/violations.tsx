import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { QualityViolationsManagement } from "@/components/quality/violations-management";

export default function QualityViolations() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.violations")} 
        description={t("quality.violations_desc", "Report and track quality violations")} 
      />
      
      <div className="mt-6">
        <QualityViolationsManagement />
      </div>
    </div>
  );
}