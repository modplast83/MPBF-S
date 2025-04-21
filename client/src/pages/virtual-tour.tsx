import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PannellumWrapper } from "@/components/ui/pannellum-wrapper";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export default function VirtualTour() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [currentArea, setCurrentArea] = useState<string>("extrusion");

  // Define panorama scenes for different areas of the factory
  const scenes = {
    extrusion: {
      title: t("virtual_tour.extrusion_area", "Extrusion Area"),
      description: t("virtual_tour.extrusion_description", "This is where the plastic is melted and formed into film through an extrusion process."),
      imageSource: "https://pannellum.org/images/cerro-toco-0.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -3,
          yaw: 117,
          type: "info",
          text: t("virtual_tour.extrusion_equip1", "Extruder machines"),
        },
        {
          pitch: -9,
          yaw: 222,
          type: "info",
          text: t("virtual_tour.extrusion_process1", "Raw material mixing"),
        },
        {
          pitch: 1,
          yaw: 175,
          type: "scene",
          text: t("virtual_tour.next_area", { area: t("virtual_tour.printing", "Printing") }),
          sceneId: "printing",
        }
      ]
    },
    printing: {
      title: t("virtual_tour.printing_area", "Printing Area"),
      description: t("virtual_tour.printing_description", "In this area, designs and branding are printed onto the plastic film."),
      imageSource: "https://pannellum.org/images/alma.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: 1,
          yaw: 150,
          type: "info",
          text: t("virtual_tour.printing_equip1", "Flexographic printing machines"),
        },
        {
          pitch: -1,
          yaw: 230,
          type: "scene",
          text: t("virtual_tour.prev_area", { area: t("virtual_tour.extrusion", "Extrusion") }),
          sceneId: "extrusion",
        },
        {
          pitch: 3,
          yaw: 45,
          type: "scene",
          text: t("virtual_tour.next_area", { area: t("virtual_tour.cutting", "Cutting") }),
          sceneId: "cutting",
        }
      ]
    },
    cutting: {
      title: t("virtual_tour.cutting_area", "Cutting Area"),
      description: t("virtual_tour.cutting_description", "Here, the printed film is cut, sealed, and formed into various bag shapes and sizes."),
      imageSource: "https://pannellum.org/images/jefe.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -10,
          yaw: 110,
          type: "info",
          text: t("virtual_tour.cutting_equip1", "Bag making machines"),
        },
        {
          pitch: 5,
          yaw: 175,
          type: "info",
          text: t("virtual_tour.cutting_process4", "Final quality inspection"),
        },
        {
          pitch: 0,
          yaw: 285,
          type: "scene",
          text: t("virtual_tour.prev_area", { area: t("virtual_tour.printing", "Printing") }),
          sceneId: "printing",
        },
        {
          pitch: -5,
          yaw: 200,
          type: "scene",
          text: t("virtual_tour.next_area", { area: t("virtual_tour.warehouse", "Warehouse") }),
          sceneId: "warehouse",
        }
      ]
    },
    warehouse: {
      title: t("virtual_tour.warehouse_area", "Warehouse Area"),
      description: t("virtual_tour.warehouse_description", "The final stage where products are packaged, stored, and prepared for shipping."),
      imageSource: "https://pannellum.org/images/millyard-nighttime.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -5,
          yaw: 120,
          type: "info",
          text: t("virtual_tour.warehouse_process2", "Order fulfillment"),
        },
        {
          pitch: 0,
          yaw: 170,
          type: "info",
          text: t("virtual_tour.warehouse_process3", "Shipping preparation"),
        },
        {
          pitch: 0,
          yaw: 220,
          type: "scene",
          text: t("virtual_tour.prev_area", { area: t("virtual_tour.cutting", "Cutting") }),
          sceneId: "cutting",
        }
      ]
    }
  };

  // Configuration for pannellum viewer
  const config = {
    autoLoad: true,
    compass: true,
    northOffset: 247.5,
    showZoomCtrl: true,
    mouseZoom: true,
    keyboardZoom: true,
    showFullscreenCtrl: true,
    disableKeyboardCtrl: false,
    hotSpots: scenes[currentArea as keyof typeof scenes].hotSpots,
    title: scenes[currentArea as keyof typeof scenes].title,
    author: t("app.full_title", "Modern Plastic Bag Factory"),
    sceneFadeDuration: 1000
  };

  const handleTabChange = (value: string) => {
    setCurrentArea(value);
  };

  const handleSceneChange = (sceneId: string) => {
    setCurrentArea(sceneId);
  };

  return (
    <div className="container p-6">
      <PageHeader 
        heading={t("virtual_tour.title", "Virtual Factory Tour")} 
        text={t("virtual_tour.description", "Explore our factory floor with 360-degree views")}
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{scenes[currentArea as keyof typeof scenes].title}</CardTitle>
          <CardDescription>{scenes[currentArea as keyof typeof scenes].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video">
            <PannellumWrapper
              width="100%"
              height="100%"
              image={scenes[currentArea as keyof typeof scenes].imageSource}
              pitch={10}
              yaw={180}
              hfov={110}
              autoLoad
              onScenechange={handleSceneChange}
              config={config}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="extrusion" value={currentArea} onValueChange={handleTabChange}>
        <TabsList className={cn("w-full grid grid-cols-4", isRTL ? "flex-row-reverse" : "")}>
          <TabsTrigger value="extrusion">{t("virtual_tour.extrusion", "Extrusion")}</TabsTrigger>
          <TabsTrigger value="printing">{t("virtual_tour.printing", "Printing")}</TabsTrigger>
          <TabsTrigger value="cutting">{t("virtual_tour.cutting", "Cutting")}</TabsTrigger>
          <TabsTrigger value="warehouse">{t("virtual_tour.warehouse", "Warehouse")}</TabsTrigger>
        </TabsList>
        <TabsContent value="extrusion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("virtual_tour.extrusion_area", "Extrusion Area")}</CardTitle>
              <CardDescription>
                {t("virtual_tour.extrusion_description", "This is where the plastic is melted and formed into film through an extrusion process.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL ? "md:grid-flow-row-dense" : "")}>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.extrusion_equip1", "Extruder machines")}</li>
                    <li>{t("virtual_tour.extrusion_equip2", "Film blower unit")}</li>
                    <li>{t("virtual_tour.extrusion_equip3", "Temperature control systems")}</li>
                    <li>{t("virtual_tour.extrusion_equip4", "Film winders")}</li>
                  </ul>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.extrusion_process1", "Raw material mixing")}</li>
                    <li>{t("virtual_tour.extrusion_process2", "Plastic melting")}</li>
                    <li>{t("virtual_tour.extrusion_process3", "Film blowing")}</li>
                    <li>{t("virtual_tour.extrusion_process4", "Initial quality check")}</li>
                  </ul>
                </div>
              </div>
              <div className={cn("mt-4", isRTL ? "text-right" : "")}>
                <Button variant="outline" onClick={() => setCurrentArea("printing")}>
                  {t("virtual_tour.next_area", { area: t("virtual_tour.printing", "Printing") })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="printing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("virtual_tour.printing_area", "Printing Area")}</CardTitle>
              <CardDescription>
                {t("virtual_tour.printing_description", "In this area, designs and branding are printed onto the plastic film.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL ? "md:grid-flow-row-dense" : "")}>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.printing_equip1", "Flexographic printing machines")}</li>
                    <li>{t("virtual_tour.printing_equip2", "Color mixing stations")}</li>
                    <li>{t("virtual_tour.printing_equip3", "Printing cylinders")}</li>
                    <li>{t("virtual_tour.printing_equip4", "Drying systems")}</li>
                  </ul>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.printing_process1", "Ink preparation")}</li>
                    <li>{t("virtual_tour.printing_process2", "Color matching")}</li>
                    <li>{t("virtual_tour.printing_process3", "Multi-color printing")}</li>
                    <li>{t("virtual_tour.printing_process4", "Print quality inspection")}</li>
                  </ul>
                </div>
              </div>
              <div className={cn("mt-4 flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                <Button variant="outline" onClick={() => setCurrentArea("extrusion")}>
                  {t("virtual_tour.prev_area", { area: t("virtual_tour.extrusion", "Extrusion") })}
                </Button>
                <Button variant="outline" onClick={() => setCurrentArea("cutting")}>
                  {t("virtual_tour.next_area", { area: t("virtual_tour.cutting", "Cutting") })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cutting" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("virtual_tour.cutting_area", "Cutting Area")}</CardTitle>
              <CardDescription>
                {t("virtual_tour.cutting_description", "Here, the printed film is cut, sealed, and formed into various bag shapes and sizes.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL ? "md:grid-flow-row-dense" : "")}>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.cutting_equip1", "Bag making machines")}</li>
                    <li>{t("virtual_tour.cutting_equip2", "Sealing equipment")}</li>
                    <li>{t("virtual_tour.cutting_equip3", "Perforation systems")}</li>
                    <li>{t("virtual_tour.cutting_equip4", "Conveyor belts")}</li>
                  </ul>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.cutting_process1", "Precise cutting")}</li>
                    <li>{t("virtual_tour.cutting_process2", "Heat sealing")}</li>
                    <li>{t("virtual_tour.cutting_process3", "Handle punching")}</li>
                    <li>{t("virtual_tour.cutting_process4", "Final quality inspection")}</li>
                  </ul>
                </div>
              </div>
              <div className={cn("mt-4 flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                <Button variant="outline" onClick={() => setCurrentArea("printing")}>
                  {t("virtual_tour.prev_area", { area: t("virtual_tour.printing", "Printing") })}
                </Button>
                <Button variant="outline" onClick={() => setCurrentArea("warehouse")}>
                  {t("virtual_tour.next_area", { area: t("virtual_tour.warehouse", "Warehouse") })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="warehouse" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("virtual_tour.warehouse_area", "Warehouse")}</CardTitle>
              <CardDescription>
                {t("virtual_tour.warehouse_description", "The final stage where products are packaged, stored, and prepared for shipping.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL ? "md:grid-flow-row-dense" : "")}>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.warehouse_equip1", "Packaging machines")}</li>
                    <li>{t("virtual_tour.warehouse_equip2", "Forklifts")}</li>
                    <li>{t("virtual_tour.warehouse_equip3", "Storage racks")}</li>
                    <li>{t("virtual_tour.warehouse_equip4", "Loading bays")}</li>
                  </ul>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className={cn("list-inside space-y-1 text-sm", isRTL ? "list-disc-rtl" : "list-disc")}>
                    <li>{t("virtual_tour.warehouse_process1", "Inventory management")}</li>
                    <li>{t("virtual_tour.warehouse_process2", "Order fulfillment")}</li>
                    <li>{t("virtual_tour.warehouse_process3", "Shipping preparation")}</li>
                    <li>{t("virtual_tour.warehouse_process4", "Quality audits")}</li>
                  </ul>
                </div>
              </div>
              <div className={cn("mt-4", isRTL ? "text-right" : "")}>
                <Button variant="outline" onClick={() => setCurrentArea("cutting")}>
                  {t("virtual_tour.prev_area", { area: t("virtual_tour.cutting", "Cutting") })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}