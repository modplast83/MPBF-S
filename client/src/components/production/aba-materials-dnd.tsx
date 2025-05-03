import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RawMaterial } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Material distribution interface for ABA calculations
export interface MaterialDistribution {
  id: string;
  materialId: number;
  materialName: string;
  screwAPercentage: number;
  screwBPercentage: number;
  totalPercentage: number;
}

interface AbaMaterialsDndProps {
  rawMaterials: RawMaterial[];
  onSave: (distributions: MaterialDistribution[]) => void;
  initialDistributions?: MaterialDistribution[];
}

export function AbaMaterialsDnd({ 
  rawMaterials, 
  onSave,
  initialDistributions = []
}: AbaMaterialsDndProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // State for the three lists (unassigned, screw A, screw B)
  const [unassignedMaterials, setUnassignedMaterials] = useState<MaterialDistribution[]>([]);
  const [screwAMaterials, setScrewAMaterials] = useState<MaterialDistribution[]>([]);
  const [screwBMaterials, setScrewBMaterials] = useState<MaterialDistribution[]>([]);

  // Initialize materials from raw materials and initial distributions
  useEffect(() => {
    if (rawMaterials.length > 0) {
      // If we have initial distributions, use them
      if (initialDistributions && initialDistributions.length > 0) {
        // Extract materials from each list based on percentages
        const screwA: MaterialDistribution[] = [];
        const screwB: MaterialDistribution[] = [];
        const unassigned: MaterialDistribution[] = [];

        initialDistributions.forEach(dist => {
          // Find the material from rawMaterials
          const material = rawMaterials.find(m => m.id === dist.materialId);
          if (!material) return;

          if (dist.screwAPercentage > 0) {
            screwA.push({...dist});
          } else if (dist.screwBPercentage > 0) {
            screwB.push({...dist});
          } else {
            unassigned.push({...dist});
          }
        });

        setScrewAMaterials(screwA);
        setScrewBMaterials(screwB);
        
        // Add any raw materials that aren't in the initial distributions to unassigned
        const assignedMaterialIds = initialDistributions.map(d => d.materialId);
        const newUnassigned = [...unassigned];
        
        rawMaterials.forEach(material => {
          if (!assignedMaterialIds.includes(material.id)) {
            newUnassigned.push({
              id: `material-${material.id}`,
              materialId: material.id,
              materialName: material.name,
              screwAPercentage: 0,
              screwBPercentage: 0,
              totalPercentage: 0
            });
          }
        });
        
        setUnassignedMaterials(newUnassigned);
      } else {
        // Initialize all materials as unassigned
        const initialMaterials = rawMaterials.map(material => ({
          id: `material-${material.id}`,
          materialId: material.id,
          materialName: material.name,
          screwAPercentage: 0,
          screwBPercentage: 0,
          totalPercentage: 0
        }));
        setUnassignedMaterials(initialMaterials);
        setScrewAMaterials([]);
        setScrewBMaterials([]);
      }
    }
  }, [rawMaterials, initialDistributions]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Get the appropriate source and destination arrays
    let sourceList: MaterialDistribution[];
    let destList: MaterialDistribution[];
    let setSourceList: React.Dispatch<React.SetStateAction<MaterialDistribution[]>>;
    let setDestList: React.Dispatch<React.SetStateAction<MaterialDistribution[]>>;
    
    // Determine source list
    switch (source.droppableId) {
      case 'unassigned':
        sourceList = unassignedMaterials;
        setSourceList = setUnassignedMaterials;
        break;
      case 'screwA':
        sourceList = screwAMaterials;
        setSourceList = setScrewAMaterials;
        break;
      case 'screwB':
        sourceList = screwBMaterials;
        setSourceList = setScrewBMaterials;
        break;
      default:
        return;
    }
    
    // Determine destination list
    switch (destination.droppableId) {
      case 'unassigned':
        destList = unassignedMaterials;
        setDestList = setUnassignedMaterials;
        break;
      case 'screwA':
        destList = screwAMaterials;
        setDestList = setScrewAMaterials;
        break;
      case 'screwB':
        destList = screwBMaterials;
        setDestList = setScrewBMaterials;
        break;
      default:
        return;
    }
    
    // If moving within the same list
    if (source.droppableId === destination.droppableId) {
      const reorderedItems = [...sourceList];
      const [movedItem] = reorderedItems.splice(source.index, 1);
      reorderedItems.splice(destination.index, 0, movedItem);
      setSourceList(reorderedItems);
    } else {
      // Moving between different lists
      const sourceClone = [...sourceList];
      const destClone = [...destList];
      const [movedItem] = sourceClone.splice(source.index, 1);
      
      // Reset percentages when moving to/from unassigned
      if (destination.droppableId === 'unassigned') {
        movedItem.screwAPercentage = 0;
        movedItem.screwBPercentage = 0;
        movedItem.totalPercentage = 0;
      } else if (destination.droppableId === 'screwA') {
        movedItem.screwAPercentage = 100;
        movedItem.screwBPercentage = 0;
        movedItem.totalPercentage = 100;
      } else if (destination.droppableId === 'screwB') {
        movedItem.screwAPercentage = 0;
        movedItem.screwBPercentage = 100;
        movedItem.totalPercentage = 100;
      }
      
      destClone.splice(destination.index, 0, movedItem);
      
      setSourceList(sourceClone);
      setDestList(destClone);
    }
  };

  // Handle slider change for screw A materials
  const handleScrewASliderChange = (index: number, value: number[]) => {
    const percentage = value[0];
    const newScrewAMaterials = [...screwAMaterials];
    newScrewAMaterials[index].screwAPercentage = percentage;
    newScrewAMaterials[index].totalPercentage = percentage;
    setScrewAMaterials(newScrewAMaterials);
  };

  // Handle slider change for screw B materials
  const handleScrewBSliderChange = (index: number, value: number[]) => {
    const percentage = value[0];
    const newScrewBMaterials = [...screwBMaterials];
    newScrewBMaterials[index].screwBPercentage = percentage;
    newScrewBMaterials[index].totalPercentage = percentage;
    setScrewBMaterials(newScrewBMaterials);
  };

  // Validate configuration and compile all materials for saving
  const handleSaveConfiguration = () => {
    // Combine all materials
    const allMaterials = [
      ...unassignedMaterials,
      ...screwAMaterials,
      ...screwBMaterials
    ];
    
    // Call the onSave callback with the compiled distributions
    onSave(allMaterials);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Unassigned Materials */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 p-4">
            <CardTitle className="text-md flex items-center">
              <span className="material-icons text-lg mr-2">view_list</span>
              {t('production.aba_calculator.available_materials')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 min-h-[300px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[250px] p-2 rounded ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {unassignedMaterials.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="material-icons text-gray-300 text-3xl mb-2">
                          science
                        </span>
                        <p className="text-gray-500 text-center">
                          {t('production.aba_calculator.no_available_materials')}
                        </p>
                      </div>
                    ) : (
                      unassignedMaterials.map((material, index) => (
                        <Draggable
                          key={material.id}
                          draggableId={material.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-2 rounded border ${
                                snapshot.isDragging
                                  ? 'bg-primary-50 border-primary-200'
                                  : 'bg-white border-gray-200'
                              } shadow-sm`}
                            >
                              <div className="flex items-center">
                                <span className="material-icons text-sm text-gray-500 mr-2">
                                  drag_indicator
                                </span>
                                <span>{material.materialName}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
          <CardFooter className="border-t p-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              {t('production.aba_calculator.drag_materials_here')}
            </div>
          </CardFooter>
        </Card>

        {/* Screw A */}
        <Card className="overflow-hidden border-primary-200">
          <CardHeader className="bg-primary-50 p-4">
            <CardTitle className="text-md flex items-center">
              <span className="material-icons text-lg mr-2">settings</span>
              {t('production.aba_calculator.screw_a')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 min-h-[300px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="screwA">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[250px] p-2 rounded ${
                      snapshot.isDraggingOver ? 'bg-primary-50' : ''
                    }`}
                  >
                    {screwAMaterials.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="material-icons text-gray-300 text-3xl mb-2">
                          settings
                        </span>
                        <p className="text-gray-500 text-center">
                          {t('production.aba_calculator.unassigned')}
                        </p>
                      </div>
                    ) : (
                      screwAMaterials.map((material, index) => (
                        <Draggable
                          key={material.id}
                          draggableId={material.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-4 rounded border ${
                                snapshot.isDragging
                                  ? 'bg-primary-100 border-primary-300'
                                  : 'bg-white border-gray-200'
                              } shadow-sm`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span>{material.materialName}</span>
                                <Badge variant="outline">
                                  {material.screwAPercentage}%
                                </Badge>
                              </div>
                              <div className="pt-2">
                                <Label className="text-xs text-gray-500 mb-2 block">
                                  {t('production.aba_calculator.percentage')}
                                </Label>
                                <Slider
                                  value={[material.screwAPercentage]}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className={`${isRTL ? 'rtl-slider' : ''}`}
                                  onValueChange={(value) => handleScrewASliderChange(index, value)}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
          <CardFooter className="border-t p-4 bg-primary-50">
            <div className="text-sm text-primary-700">
              {t('production.aba_calculator.a_description')}
            </div>
          </CardFooter>
        </Card>

        {/* Screw B */}
        <Card className="overflow-hidden border-secondary-200">
          <CardHeader className="bg-secondary-50 p-4">
            <CardTitle className="text-md flex items-center">
              <span className="material-icons text-lg mr-2">settings</span>
              {t('production.aba_calculator.screw_b')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 min-h-[300px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="screwB">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[250px] p-2 rounded ${
                      snapshot.isDraggingOver ? 'bg-secondary-50' : ''
                    }`}
                  >
                    {screwBMaterials.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="material-icons text-gray-300 text-3xl mb-2">
                          settings
                        </span>
                        <p className="text-gray-500 text-center">
                          {t('production.aba_calculator.unassigned')}
                        </p>
                      </div>
                    ) : (
                      screwBMaterials.map((material, index) => (
                        <Draggable
                          key={material.id}
                          draggableId={material.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-4 rounded border ${
                                snapshot.isDragging
                                  ? 'bg-secondary-100 border-secondary-300'
                                  : 'bg-white border-gray-200'
                              } shadow-sm`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span>{material.materialName}</span>
                                <Badge variant="outline">
                                  {material.screwBPercentage}%
                                </Badge>
                              </div>
                              <div className="pt-2">
                                <Label className="text-xs text-gray-500 mb-2 block">
                                  {t('production.aba_calculator.percentage')}
                                </Label>
                                <Slider
                                  value={[material.screwBPercentage]}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className={`${isRTL ? 'rtl-slider' : ''}`}
                                  onValueChange={(value) => handleScrewBSliderChange(index, value)}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
          <CardFooter className="border-t p-4 bg-secondary-50">
            <div className="text-sm text-secondary-700">
              {t('production.aba_calculator.b_description')}
            </div>
          </CardFooter>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-gray-500 text-sm">
                <span className="material-icons text-primary-500 text-base mr-1">help_outline</span>
                {t('production.aba_calculator.configuration_help')}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p>{t('production.aba_calculator.drag_help')}</p>
                <p>{t('production.aba_calculator.slider_help')}</p>
                <p>{t('production.aba_calculator.save_help')}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button 
          onClick={handleSaveConfiguration}
          className="flex items-center"
        >
          <span className="material-icons text-sm mr-1">save</span>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}