import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RollCard } from "@/components/workflow/roll-card";
import { CollapsibleJobOrdersForExtrusion } from "@/components/workflow/collapsible-job-orders";
import { GroupedRolls } from "@/components/workflow/grouped-rolls";
import { API_ENDPOINTS } from "@/lib/constants";
import { Roll } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth-v2";

export default function WorkflowIndex() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("extrusion");
  const isMobile = useIsMobile();
  const { hasWorkflowTabPermission } = usePermissions();
  const { user } = useAuth();
  
  // Determine which tabs should be visible based on permissions
  const showExtrusionTab = hasWorkflowTabPermission("extrusion");
  const showPrintingTab = hasWorkflowTabPermission("printing");
  const showCuttingTab = hasWorkflowTabPermission("cutting");
  
  // Set a valid default tab based on permissions
  useEffect(() => {
    if (activeTab === "extrusion" && !showExtrusionTab) {
      if (showPrintingTab) {
        setActiveTab("printing");
      } else if (showCuttingTab) {
        setActiveTab("cutting");
      } else {
        // Fallback if no tabs are allowed - shouldn't happen with proper route protection
        setActiveTab(null);
      }
    }
  }, [showExtrusionTab, showPrintingTab, showCuttingTab, activeTab]);
  
  // Calculate number of visible tabs for grid layout
  const visibleTabsCount = [showExtrusionTab, showPrintingTab, showCuttingTab].filter(Boolean).length;
  
  // Fetch rolls by stage - only fetch what we need based on permissions and active tab
  const { data: extrusionRolls, isLoading: extrusionLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`],
    enabled: showExtrusionTab && (activeTab === "extrusion" || activeTab === null),
  });
  
  const { data: printingRolls, isLoading: printingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`],
    enabled: showPrintingTab && (activeTab === "printing" || activeTab === null),
  });
  
  const { data: cuttingRolls, isLoading: cuttingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`],
    enabled: showCuttingTab && (activeTab === "cutting" || activeTab === null),
  });

  // If no tabs are visible, show a message
  if (visibleTabsCount === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-secondary-500">
          <div className="material-icons text-4xl mb-2">lock</div>
          <h2 className="text-xl font-medium mb-1">No Access</h2>
          <p>You don't have permission to access any workflow tabs.</p>
        </div>
      </div>
    );
  }
  
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
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 md:pb-6 px-3 sm:px-6">
          <CardTitle className="text-base md:text-lg">{t("production.roll_management.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Tabs defaultValue={activeTab || undefined} onValueChange={setActiveTab}>
            {/* Dynamic TabsList based on visible tabs */}
            <TabsList 
              className="w-full flex mb-4 md:mb-6 p-0.5 gap-0.5 md:gap-1 bg-muted overflow-hidden"
            >
              {showExtrusionTab && (
                <TabsTrigger value="extrusion" className="flex-1 flex flex-col md:flex-row items-center justify-center md:gap-1.5 py-1.5 md:py-2 px-0.5 md:px-2">
                  <span className="material-icons text-primary-500 text-sm md:text-lg">merge_type</span>
                  <span className="text-xs md:text-sm hidden md:inline">{t("rolls.extrusion")}</span>
                  <span className="text-[9px] md:hidden">Extr</span>
                  <span className="h-3.5 w-3.5 md:h-5 md:w-5 flex-shrink-0 rounded-full bg-primary-100 text-[9px] md:text-xs flex items-center justify-center">
                    {extrusionLoading ? "-" : extrusionRolls?.length || 0}
                  </span>
                </TabsTrigger>
              )}
              
              {showPrintingTab && (
                <TabsTrigger value="printing" className="flex-1 flex flex-col md:flex-row items-center justify-center md:gap-1.5 py-1.5 md:py-2 px-0.5 md:px-2">
                  <span className="material-icons text-warning-500 text-sm md:text-lg">format_color_fill</span>
                  <span className="text-xs md:text-sm hidden md:inline">{t("rolls.printing")}</span>
                  <span className="text-[9px] md:hidden">Print</span>
                  <span className="h-3.5 w-3.5 md:h-5 md:w-5 flex-shrink-0 rounded-full bg-warning-100 text-[9px] md:text-xs flex items-center justify-center">
                    {printingLoading ? "-" : printingRolls?.length || 0}
                  </span>
                </TabsTrigger>
              )}
              
              {showCuttingTab && (
                <TabsTrigger value="cutting" className="flex-1 flex flex-col md:flex-row items-center justify-center md:gap-1.5 py-1.5 md:py-2 px-0.5 md:px-2">
                  <span className="material-icons text-success text-sm md:text-lg">content_cut</span>
                  <span className="text-xs md:text-sm hidden md:inline">{t("rolls.cutting")}</span>
                  <span className="text-[9px] md:hidden">Cut</span>
                  <span className="h-3.5 w-3.5 md:h-5 md:w-5 flex-shrink-0 rounded-full bg-success-100 text-[9px] md:text-xs flex items-center justify-center">
                    {cuttingLoading ? "-" : cuttingRolls?.filter(roll => roll.status !== "completed").length || 0}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Extrusion Tab Content */}
            {showExtrusionTab && (
              <TabsContent value="extrusion" className="space-y-4">
                <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                  <div className="flex flex-wrap items-start md:items-center mb-4">
                    <div className="rounded-full bg-primary-100 p-2 mr-3 shrink-0">
                      <span className="material-icons text-primary-500">merge_type</span>
                    </div>
                    <div className="flex-1 min-w-0 mt-1 md:mt-0">
                      <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.extrusion_stage")}</h4>
                      <p className="text-xs md:text-sm text-secondary-500 truncate">{t("production.roll_management.create_rolls")}</p>
                    </div>
                  </div>
                  
                  {/* Job Orders for Extrusion - Collapsible by Order ID */}
                  <CollapsibleJobOrdersForExtrusion />
                  
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
                        // Sort rolls by job order ID first, then by roll ID
                        [...extrusionRolls]
                          .sort((a, b) => {
                            // First sort by job order ID
                            if (a.jobOrderId !== b.jobOrderId) {
                              return a.jobOrderId - b.jobOrderId;
                            }
                            // Then sort by roll ID
                            return a.id.localeCompare(b.id);
                          })
                          .map((roll) => (
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
            )}
            
            {/* Printing Tab Content */}
            {showPrintingTab && (
              <TabsContent value="printing" className="space-y-4">
                <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                  <div className="flex flex-wrap items-start md:items-center mb-4">
                    <div className="rounded-full bg-warning-100 p-2 mr-3 shrink-0">
                      <span className="material-icons text-warning-500">format_color_fill</span>
                    </div>
                    <div className="flex-1 min-w-0 mt-1 md:mt-0">
                      <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.printing_stage")}</h4>
                      <p className="text-xs md:text-sm text-secondary-500 truncate">
                        {printingLoading 
                          ? t("production.roll_management.loading") 
                          : `${printingRolls?.length || 0} ${t("production.roll_management.rolls_ready_printing")}`}
                      </p>
                      <p className="text-xs text-secondary-400 italic line-clamp-2 md:line-clamp-none">
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
                      <GroupedRolls rolls={printingRolls} stage="printing" />
                    ) : (
                      <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                        <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                        <p className="text-sm">{t("production.roll_management.no_rolls_printing")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
            
            {/* Cutting Tab Content */}
            {showCuttingTab && (
              <TabsContent value="cutting" className="space-y-4">
                <div className="bg-secondary-50 rounded-lg p-3 md:p-4">
                  <div className="flex flex-wrap items-start md:items-center mb-4">
                    <div className="rounded-full bg-success-100 p-2 mr-3 shrink-0">
                      <span className="material-icons text-success">content_cut</span>
                    </div>
                    <div className="flex-1 min-w-0 mt-1 md:mt-0">
                      <h4 className="font-medium text-sm md:text-base">{t("production.roll_management.cutting_stage")}</h4>
                      <p className="text-xs md:text-sm text-secondary-500 truncate">
                        {cuttingLoading 
                          ? t("production.roll_management.loading") 
                          : `${cuttingRolls?.filter(roll => roll.status !== "completed").length || 0} ${t("production.roll_management.rolls_ready_cutting")}`}
                      </p>
                      <p className="text-xs text-secondary-400 italic line-clamp-2 md:line-clamp-none">
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
                      <GroupedRolls rolls={cuttingRolls} stage="cutting" />
                    ) : (
                      <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                        <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                        <p className="text-sm">{t("production.roll_management.no_rolls_cutting")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}