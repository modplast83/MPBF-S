import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function QualityCheckTypes() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.check_types")} 
        description={t("quality.check_types_desc", "Define quality check templates for different stages")} 
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("quality.check_types")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("common.coming_soon", "This feature is coming soon.")}</p>
        </CardContent>
      </Card>
    </div>
  );
}