import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QualityPenaltiesManagement() {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("quality.penalties", "Quality Penalties")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {t("quality.penalties_removed", "Quality penalties functionality has been removed from the system.")}
        </p>
      </CardContent>
    </Card>
  );
}