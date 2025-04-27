import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import { H2 } from "@/components/ui/typography";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/use-language";
import { usePermissions } from "@/hooks/use-permissions";

// Import component modules
import Calculator from "@/components/cliches/calculator";
import Parameters from "@/components/cliches/parameters";
import History from "@/components/cliches/history";

export default function ClichePage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("calculator");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className={`container ${isRTL ? 'rtl' : ''} px-4 py-8 mx-auto`}>
      <PageHeader
        title={t("cliches.title")}
        icon="design_services"
      />

      <Card className="mt-6 overflow-hidden">
        <Tabs 
          defaultValue="calculator" 
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className={`px-4 py-2 border-b ${isMobile ? 'overflow-x-auto' : ''}`}>
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'max-w-md grid-cols-3'}`}>
              <TabsTrigger value="calculator">
                <span className="material-icons mr-1 text-lg">calculate</span>
                <span>{t("cliches.calculator")}</span>
              </TabsTrigger>
              
              {hasPermission("Parameters") && (
                <TabsTrigger value="parameters">
                  <span className="material-icons mr-1 text-lg">tune</span>
                  <span>{t("cliches.parameters")}</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger value="history">
                <span className="material-icons mr-1 text-lg">history</span>
                <span>{t("cliches.history")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calculator" className="p-4 space-y-6">
            <H2>{t("cliches.calculatorTitle")}</H2>
            <Calculator />
          </TabsContent>

          {hasPermission("Parameters") && (
            <TabsContent value="parameters" className="p-4 space-y-6">
              <H2>{t("cliches.parametersTitle")}</H2>
              <Parameters />
            </TabsContent>
          )}

          <TabsContent value="history" className="p-4 space-y-6">
            <H2>{t("cliches.historyTitle")}</H2>
            <History />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}