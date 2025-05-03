import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RawMaterial } from '@shared/schema';

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
  initialDistributions
}: AbaMaterialsDndProps) {
  const { t } = useTranslation();
  const [screwAMaterials, setScrewAMaterials] = useState<MaterialDistribution[]>([]);
  const [screwBMaterials, setScrewBMaterials] = useState<MaterialDistribution[]>([]);
  const [unassignedMaterials, setUnassignedMaterials] = useState<MaterialDistribution[]>([]);
  
  // Initialize the component with raw materials
  useEffect(() => {
    if (initialDistributions && initialDistributions.length > 0) {
      const screwA: MaterialDistribution[] = [];
      const screwB: MaterialDistribution[] = [];
      const unassigned: MaterialDistribution[] = [];
      
      initialDistributions.forEach(dist => {
        if (dist.screwAPercentage > 0 && dist.screwBPercentage === 0) {
          screwA.push(dist);
        } else if (dist.screwBPercentage > 0 && dist.screwAPercentage === 0) {
          screwB.push(dist);
        } else {
          unassigned.push(dist);
        }
      });
      
      setScrewAMaterials(screwA);
      setScrewBMaterials(screwB);
      setUnassignedMaterials(unassigned);
    } else {
      // Initialize with raw materials from props
      const initialUnassigned = rawMaterials.map(material => ({
        id: `material-${material.id}`,
        materialId: material.id,
        materialName: material.name,
        screwAPercentage: 0,
        screwBPercentage: 0,
        totalPercentage: 50 // Default percentage
      }));
      
      setUnassignedMaterials(initialUnassigned);
      setScrewAMaterials([]);
      setScrewBMaterials([]);
    }
  }, [rawMaterials, initialDistributions]);
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // No change in position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Handle drag between lists
    let sourceList: MaterialDistribution[];
    let destinationList: MaterialDistribution[];
    
    // Determine source list
    if (source.droppableId === 'screw-a') {
      sourceList = [...screwAMaterials];
    } else if (source.droppableId === 'screw-b') {
      sourceList = [...screwBMaterials];
    } else {
      sourceList = [...unassignedMaterials];
    }
    
    // Determine destination list
    if (destination.droppableId === 'screw-a') {
      destinationList = [...screwAMaterials];
    } else if (destination.droppableId === 'screw-b') {
      destinationList = [...screwBMaterials];
    } else {
      destinationList = [...unassignedMaterials];
    }
    
    // Same list rearrangement
    if (source.droppableId === destination.droppableId) {
      const [removed] = sourceList.splice(source.index, 1);
      sourceList.splice(destination.index, 0, removed);
      
      // Update the appropriate state
      if (source.droppableId === 'screw-a') {
        setScrewAMaterials(sourceList);
      } else if (source.droppableId === 'screw-b') {
        setScrewBMaterials(sourceList);
      } else {
        setUnassignedMaterials(sourceList);
      }
      
      return;
    }
    
    // Moving between different lists
    const [removed] = sourceList.splice(source.index, 1);
    
    // Reset percentages based on destination
    let updatedItem = { ...removed };
    
    if (destination.droppableId === 'screw-a') {
      updatedItem.screwAPercentage = 100;
      updatedItem.screwBPercentage = 0;
    } else if (destination.droppableId === 'screw-b') {
      updatedItem.screwAPercentage = 0;
      updatedItem.screwBPercentage = 100;
    } else {
      updatedItem.screwAPercentage = 0;
      updatedItem.screwBPercentage = 0;
    }
    
    destinationList.splice(destination.index, 0, updatedItem);
    
    // Update states
    if (source.droppableId === 'screw-a') {
      setScrewAMaterials(sourceList);
    } else if (source.droppableId === 'screw-b') {
      setScrewBMaterials(sourceList);
    } else {
      setUnassignedMaterials(sourceList);
    }
    
    if (destination.droppableId === 'screw-a') {
      setScrewAMaterials(destinationList);
    } else if (destination.droppableId === 'screw-b') {
      setScrewBMaterials(destinationList);
    } else {
      setUnassignedMaterials(destinationList);
    }
  };
  
  const handlePercentageChange = (materialId: string, value: number, screw: 'a' | 'b') => {
    if (screw === 'a') {
      const updatedMaterials = screwAMaterials.map(item => 
        item.id === materialId 
          ? { ...item, totalPercentage: value } 
          : item
      );
      setScrewAMaterials(updatedMaterials);
    } else {
      const updatedMaterials = screwBMaterials.map(item => 
        item.id === materialId 
          ? { ...item, totalPercentage: value } 
          : item
      );
      setScrewBMaterials(updatedMaterials);
    }
  };
  
  const handleSaveConfiguration = () => {
    // Combine all materials with their current assignments
    const allMaterials = [
      ...screwAMaterials.map(m => ({ ...m, screwAPercentage: 100, screwBPercentage: 0 })),
      ...screwBMaterials.map(m => ({ ...m, screwAPercentage: 0, screwBPercentage: 100 })),
      ...unassignedMaterials
    ];
    
    onSave(allMaterials);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleSaveConfiguration}>
          {t('common.save')} {t('production.aba_calculator.configuration')}
        </Button>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Screw A */}
          <Card>
            <CardHeader className="bg-red-100">
              <CardTitle>{t('production.aba_calculator.screw_a')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Droppable droppableId="screw-a">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px] border border-dashed rounded-md p-2"
                  >
                    {screwAMaterials.map((material, index) => (
                      <Draggable key={material.id} draggableId={material.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white shadow-sm rounded-md p-3 mb-2 border"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{material.materialName}</h4>
                              <Badge className="bg-red-200 text-red-800">A</Badge>
                            </div>
                            <div className="mt-2">
                              <Label htmlFor={`slider-${material.id}`} className="text-xs flex justify-between">
                                <span>{t('production.aba_calculator.percentage')}</span>
                                <span>{material.totalPercentage}%</span>
                              </Label>
                              <Slider
                                id={`slider-${material.id}`}
                                value={[material.totalPercentage]}
                                min={1}
                                max={100}
                                step={1}
                                onValueChange={([value]) => handlePercentageChange(material.id, value, 'a')}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {screwAMaterials.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('production.aba_calculator.drag_materials_here')}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
          
          {/* Unassigned Materials */}
          <Card>
            <CardHeader className="bg-gray-100">
              <CardTitle>{t('production.aba_calculator.available_materials')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Droppable droppableId="unassigned">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px] border border-dashed rounded-md p-2"
                  >
                    {unassignedMaterials.map((material, index) => (
                      <Draggable key={material.id} draggableId={material.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white shadow-sm rounded-md p-3 mb-2 border"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{material.materialName}</h4>
                              <Badge className="bg-gray-200 text-gray-800">
                                {t('production.aba_calculator.unassigned')}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {unassignedMaterials.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('production.aba_calculator.no_available_materials')}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
          
          {/* Screw B */}
          <Card>
            <CardHeader className="bg-orange-100">
              <CardTitle>{t('production.aba_calculator.screw_b')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Droppable droppableId="screw-b">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px] border border-dashed rounded-md p-2"
                  >
                    {screwBMaterials.map((material, index) => (
                      <Draggable key={material.id} draggableId={material.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white shadow-sm rounded-md p-3 mb-2 border"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{material.materialName}</h4>
                              <Badge className="bg-orange-200 text-orange-800">B</Badge>
                            </div>
                            <div className="mt-2">
                              <Label htmlFor={`slider-${material.id}`} className="text-xs flex justify-between">
                                <span>{t('production.aba_calculator.percentage')}</span>
                                <span>{material.totalPercentage}%</span>
                              </Label>
                              <Slider
                                id={`slider-${material.id}`}
                                value={[material.totalPercentage]}
                                min={1}
                                max={100}
                                step={1}
                                onValueChange={([value]) => handlePercentageChange(material.id, value, 'b')}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {screwBMaterials.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('production.aba_calculator.drag_materials_here')}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
      
      <div className="bg-muted p-4 rounded-md mt-4">
        <h3 className="font-medium mb-2">{t('production.aba_calculator.configuration_help')}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>{t('production.aba_calculator.drag_help')}</li>
          <li>{t('production.aba_calculator.slider_help')}</li>
          <li>{t('production.aba_calculator.save_help')}</li>
        </ul>
      </div>
    </div>
  );
}