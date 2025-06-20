import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { IntegratedQualityChecksManagement } from "@/components/quality/integrated-quality-check-form";

export default function QualityChecks() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.quality_checks")} 
        description={t("quality.checks_desc", "Perform and track quality inspections")} 
      />
      
      <div className="mt-6">
        <IntegratedQualityChecksManagement />
      </div>
    </div>
  );
}