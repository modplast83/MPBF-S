import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function QualityReports() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.reports")} 
        description={t("quality.reports_desc", "Generate quality violation reports")} 
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("quality.reports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("common.coming_soon", "This feature is coming soon.")}</p>
        </CardContent>
      </Card>
    </div>
  );
}