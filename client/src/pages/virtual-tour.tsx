import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pannellum } from "react-pannellum";

export default function VirtualTour() {
  const { t } = useTranslation();
  const [currentArea, setCurrentArea] = useState<string>("extrusion");

  // Define panorama scenes for different areas of the factory
  const scenes = {
    extrusion: {
      title: "Extrusion Area",
      description: "The extrusion department where plastic film is made from raw materials",
      imageSource: "https://pannellum.org/images/cerro-toco-0.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -3,
          yaw: 117,
          type: "info",
          text: "Extrusion Machine 1",
        },
        {
          pitch: -9,
          yaw: 222,
          type: "info",
          text: "Raw Material Storage",
        },
        {
          pitch: 1,
          yaw: 175,
          type: "scene",
          text: "Go to Printing Area",
          sceneId: "printing",
        }
      ]
    },
    printing: {
      title: "Printing Area",
      description: "Where designs are printed onto plastic film",
      imageSource: "https://pannellum.org/images/alma.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: 1,
          yaw: 150,
          type: "info",
          text: "Printing Machine 1",
        },
        {
          pitch: -1,
          yaw: 230,
          type: "scene",
          text: "Go to Extrusion Area",
          sceneId: "extrusion",
        },
        {
          pitch: 3,
          yaw: 45,
          type: "scene",
          text: "Go to Cutting Area",
          sceneId: "cutting",
        }
      ]
    },
    cutting: {
      title: "Cutting Area",
      description: "Where printed film is cut into finished bags",
      imageSource: "https://pannellum.org/images/jefe.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -10,
          yaw: 110,
          type: "info",
          text: "Cutting Machine 1",
        },
        {
          pitch: 5,
          yaw: 175,
          type: "info",
          text: "Quality Check Station",
        },
        {
          pitch: 0,
          yaw: 285,
          type: "scene",
          text: "Go to Printing Area",
          sceneId: "printing",
        },
        {
          pitch: -5,
          yaw: 200,
          type: "scene",
          text: "Go to Warehouse",
          sceneId: "warehouse",
        }
      ]
    },
    warehouse: {
      title: "Warehouse",
      description: "Storage area for finished products ready for shipping",
      imageSource: "https://pannellum.org/images/millyard-nighttime.jpg", // Placeholder until real factory images are available
      hotSpots: [
        {
          pitch: -5,
          yaw: 120,
          type: "info",
          text: "Finished Product Storage",
        },
        {
          pitch: 0,
          yaw: 170,
          type: "info",
          text: "Shipping Station",
        },
        {
          pitch: 0,
          yaw: 220,
          type: "scene",
          text: "Go to Cutting Area",
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
    author: "Modern Plastic Bag Factory",
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
        title={t("virtual_tour.title", "Virtual Factory Tour")} 
        description={t("virtual_tour.description", "Explore our factory floor with 360-degree views")}
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{scenes[currentArea as keyof typeof scenes].title}</CardTitle>
          <CardDescription>{scenes[currentArea as keyof typeof scenes].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video">
            <Pannellum
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
        <TabsList className="w-full grid grid-cols-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.extrusion_equip1", "Extruder machines")}</li>
                    <li>{t("virtual_tour.extrusion_equip2", "Film blower unit")}</li>
                    <li>{t("virtual_tour.extrusion_equip3", "Temperature control systems")}</li>
                    <li>{t("virtual_tour.extrusion_equip4", "Film winders")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.extrusion_process1", "Raw material mixing")}</li>
                    <li>{t("virtual_tour.extrusion_process2", "Plastic melting")}</li>
                    <li>{t("virtual_tour.extrusion_process3", "Film blowing")}</li>
                    <li>{t("virtual_tour.extrusion_process4", "Initial quality check")}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setCurrentArea("printing")}>
                  {t("virtual_tour.next_area", "Next Area: Printing")}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.printing_equip1", "Flexographic printing machines")}</li>
                    <li>{t("virtual_tour.printing_equip2", "Color mixing stations")}</li>
                    <li>{t("virtual_tour.printing_equip3", "Printing cylinders")}</li>
                    <li>{t("virtual_tour.printing_equip4", "Drying systems")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.printing_process1", "Ink preparation")}</li>
                    <li>{t("virtual_tour.printing_process2", "Color matching")}</li>
                    <li>{t("virtual_tour.printing_process3", "Multi-color printing")}</li>
                    <li>{t("virtual_tour.printing_process4", "Print quality inspection")}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 space-x-2">
                <Button variant="outline" onClick={() => setCurrentArea("extrusion")}>
                  {t("virtual_tour.prev_area", "Previous Area: Extrusion")}
                </Button>
                <Button variant="outline" onClick={() => setCurrentArea("cutting")}>
                  {t("virtual_tour.next_area", "Next Area: Cutting")}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.cutting_equip1", "Bag making machines")}</li>
                    <li>{t("virtual_tour.cutting_equip2", "Sealing equipment")}</li>
                    <li>{t("virtual_tour.cutting_equip3", "Perforation systems")}</li>
                    <li>{t("virtual_tour.cutting_equip4", "Conveyor belts")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.cutting_process1", "Precise cutting")}</li>
                    <li>{t("virtual_tour.cutting_process2", "Heat sealing")}</li>
                    <li>{t("virtual_tour.cutting_process3", "Handle punching")}</li>
                    <li>{t("virtual_tour.cutting_process4", "Final quality inspection")}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 space-x-2">
                <Button variant="outline" onClick={() => setCurrentArea("printing")}>
                  {t("virtual_tour.prev_area", "Previous Area: Printing")}
                </Button>
                <Button variant="outline" onClick={() => setCurrentArea("warehouse")}>
                  {t("virtual_tour.next_area", "Next Area: Warehouse")}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_equipment", "Key Equipment:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.warehouse_equip1", "Packaging machines")}</li>
                    <li>{t("virtual_tour.warehouse_equip2", "Forklifts")}</li>
                    <li>{t("virtual_tour.warehouse_equip3", "Storage racks")}</li>
                    <li>{t("virtual_tour.warehouse_equip4", "Loading bays")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("virtual_tour.key_processes", "Key Processes:")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t("virtual_tour.warehouse_process1", "Inventory management")}</li>
                    <li>{t("virtual_tour.warehouse_process2", "Order fulfillment")}</li>
                    <li>{t("virtual_tour.warehouse_process3", "Shipping preparation")}</li>
                    <li>{t("virtual_tour.warehouse_process4", "Quality audits")}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setCurrentArea("cutting")}>
                  {t("virtual_tour.prev_area", "Previous Area: Cutting")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}