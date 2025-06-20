import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QualityViolations() {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("quality.violations", "Quality Violations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {t("quality.violations_removed", "Quality violations functionality has been removed from the system.")}
        </p>
      </CardContent>
    </Card>
  );
}