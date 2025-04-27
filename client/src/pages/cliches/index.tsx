import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader } from "lucide-react";

import CalculatorComponent from "@/components/cliches/calculator";
import PlatePricingParameters from "@/components/cliches/parameters";
import PlatePricingHistory from "@/components/cliches/history";

export default function ClichePageIndex() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("calculator");

  // Fetch calculation history
  const { data: calculationHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/plate-calculations"],
    enabled: activeTab === "history"
  });

  // Fetch pricing parameters
  const { data: pricingParameters, isLoading: isParametersLoading } = useQuery({
    queryKey: ["/api/plate-pricing-parameters"],
    enabled: activeTab === "parameters"
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <H1>{t("cliches.title")}</H1>
      </div>

      <Tabs
        defaultValue="calculator"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="calculator">{t("cliches.calculator")}</TabsTrigger>
          <TabsTrigger value="parameters">{t("cliches.parameters")}</TabsTrigger>
          <TabsTrigger value="history">{t("cliches.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cliches.calculatorTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculatorComponent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cliches.parametersTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isParametersLoading ? (
                <div className="w-full flex justify-center p-8">
                  <Loader className="animate-spin h-8 w-8" />
                </div>
              ) : (
                <PlatePricingParameters parameters={pricingParameters || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cliches.historyTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="w-full flex justify-center p-8">
                  <Loader className="animate-spin h-8 w-8" />
                </div>
              ) : (
                <PlatePricingHistory calculations={calculationHistory || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}