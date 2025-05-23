import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { EnhancedQualityCheckForm } from "@/components/quality/enhanced-quality-check-form";
import { EnhancedViolationManagement } from "@/components/quality/enhanced-violation-management";
import { EnhancedPenaltiesManagement } from "@/components/quality/enhanced-penalties-management";
import { EnhancedCorrectiveActions } from "@/components/quality/enhanced-corrective-actions";
import { useTranslation } from "react-i18next";

export default function EnhancedQualityModule() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("violations");

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <PageHeader 
        title={t("quality.enhanced_quality_control")}
        description={t("quality.enhanced_quality_description")}
      />

      <Tabs 
        defaultValue="violations" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-4 w-full mb-6">
          <TabsTrigger value="violations">{t("quality.violations")}</TabsTrigger>
          <TabsTrigger value="corrective-actions">{t("quality.corrective_actions.title")}</TabsTrigger>
          <TabsTrigger value="penalties">{t("quality.penalties.title")}</TabsTrigger>
          <TabsTrigger value="check-form">{t("quality.check_form")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="violations">
          <Card className="p-4 sm:p-6">
            <EnhancedViolationManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="corrective-actions">
          <Card className="p-4 sm:p-6">
            <EnhancedCorrectiveActions />
          </Card>
        </TabsContent>
        
        <TabsContent value="penalties">
          <Card className="p-4 sm:p-6">
            <EnhancedPenaltiesManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="check-form">
          <Card className="p-4 sm:p-6">
            <EnhancedQualityCheckForm
              checkTypes={[]}
              rolls={[]}
              jobOrders={[]}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}