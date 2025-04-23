import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RollCard } from "@/components/workflow/roll-card";
import { JobOrdersForExtrusion } from "@/components/workflow/job-orders-for-extrusion-fixed";
import { API_ENDPOINTS } from "@/lib/constants";
import { Roll } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export default function WorkflowIndex() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("extrusion");
  const isMobile = useIsMobile();
  
  // Fetch rolls by stage
  const { data: extrusionRolls, isLoading: extrusionLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`],
  });
  
  const { data: printingRolls, isLoading: printingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`],
  });
  
  const { data: cuttingRolls, isLoading: cuttingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`],
  });
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section - Responsive layout */}
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'} mb-4 md:mb-6`}>
        <h1 className="text-xl md:text-2xl font-bold text-secondary-900">{t("production.workflow")}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center">
            <span className="material-icons text-sm mr-1">filter_list</span>
            {isMobile ? "" : t("common.filter")}
          </Button>
          <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center">
            <span className="material-icons text-sm mr-1">file_download</span>
            {isMobile ? "" : t("common.export")}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2 md:pb-6">
          <CardTitle className="text-base md:text-lg">{t("production.roll_management.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="extrusion" onValueChange={setActiveTab}>
            {/* Full tabs with better mobile layout */}
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6">
              <TabsTrigger value="extrusion" className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:px-2 h-auto text-center">
                <span className="material-icons text-primary-500 text-base md:text-lg">merge_type</span>
                <span className="text-xs md:text-sm truncate">{t("rolls.extrusion")}</span>
                <span className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary-100 text-xs flex items-center justify-center">
                  {extrusionLoading ? "-" : extrusionRolls?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="printing" className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:px-2 h-auto text-center">
                <span className="material-icons text-warning-500 text-base md:text-lg">format_color_fill</span>
                <span className="text-xs md:text-sm truncate">{t("rolls.printing")}</span>
                <span className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-warning-100 text-xs flex items-center justify-center">
                  {printingLoading ? "-" : printingRolls?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cutting" className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 px-1 md:px-2 h-auto text-center">
                <span className="material-icons text-success text-base md:text-lg">content_cut</span>
                <span className="text-xs md:text-sm truncate">{t("rolls.cutting")}</span>
                <span className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-success-100 text-xs flex items-center justify-center">
                  {cuttingLoading ? "-" : cuttingRolls?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="extrusion" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-primary-100 p-2 mr-3">
                    <span className="material-icons text-primary-500">merge_type</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.extrusion_stage")}</h4>
                    <p className="text-xs md:text-sm text-secondary-500">{t("production.roll_management.create_rolls")}</p>
                  </div>
                </div>
                
                {/* Job Orders for Extrusion */}
                <JobOrdersForExtrusion />
                
                {/* Active Extrusion Rolls */}
                <div className="mt-4 md:mt-6">
                  <h5 className="font-medium text-sm md:text-base mb-3">{t("production.roll_management.rolls_in_extrusion")}</h5>
                  <div className="space-y-3">
                    {extrusionLoading ? (
                      <>
                        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      </>
                    ) : extrusionRolls && extrusionRolls.length > 0 ? (
                      extrusionRolls.map((roll) => (
                        <RollCard key={roll.id} roll={roll} />
                      ))
                    ) : (
                      <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                        <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                        <p className="text-sm">{t("production.roll_management.no_rolls_extrusion")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="printing" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-warning-100 p-2 mr-3">
                    <span className="material-icons text-warning-500">format_color_fill</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.printing_stage")}</h4>
                    <p className="text-xs md:text-sm text-secondary-500">
                      {printingLoading 
                        ? t("production.roll_management.loading") 
                        : `${printingRolls?.length || 0} ${t("production.roll_management.rolls_ready_printing")}`}
                    </p>
                    <p className="text-xs text-secondary-400 italic">
                      {t("production.roll_management.printing_note")}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {printingLoading ? (
                    <>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                    </>
                  ) : printingRolls && printingRolls.length > 0 ? (
                    printingRolls.map((roll) => (
                      <RollCard key={roll.id} roll={roll} />
                    ))
                  ) : (
                    <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                      <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                      <p className="text-sm">{t("production.roll_management.no_rolls_printing")}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cutting" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-success-100 p-2 mr-3">
                    <span className="material-icons text-success">content_cut</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.cutting_stage")}</h4>
                    <p className="text-xs md:text-sm text-secondary-500">
                      {cuttingLoading 
                        ? t("production.roll_management.loading") 
                        : `${cuttingRolls?.length || 0} ${t("production.roll_management.rolls_ready_cutting")}`}
                    </p>
                    <p className="text-xs text-secondary-400 italic">
                      {t("production.roll_management.cutting_note")}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {cuttingLoading ? (
                    <>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                    </>
                  ) : cuttingRolls && cuttingRolls.length > 0 ? (
                    cuttingRolls.map((roll) => (
                      <RollCard key={roll.id} roll={roll} />
                    ))
                  ) : (
                    <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                      <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                      <p className="text-sm">{t("production.roll_management.no_rolls_cutting")}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}