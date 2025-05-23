import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function QualityCorrectiveActions() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title={t("quality.corrective_actions")} 
        description={t("quality.actions_desc", "Track and resolve quality issues")} 
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("quality.corrective_actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("common.coming_soon", "This feature is coming soon.")}</p>
        </CardContent>
      </Card>
    </div>
  );
}