import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobOrder } from "@shared/schema";

// Material cost calculation result interface
interface MaterialCost {
  name: string;
  pricePerKg: number;
  percentage: number;
  quantity: number;
  cost: number;
}

// Overall cost calculation result interface
interface CostCalculationResult {
  orderQuantity: number;
  wastePercentage: number;
  totalQuantity: number;
  wasteCost: number;
  fixedCostPerKg: number;
  totalFixedCost: number;
  totalMaterialCost: number;
  totalCost: number;
  costPerKg: number;
  materials: MaterialCost[];
}

export default function CostCalculator() {
  const { t } = useTranslation();
  
  // Fetch job orders
  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
    select: (data) => data.filter(job => job.status === 'pending' || job.status === 'in_progress'),
  });

  // State for selected job order
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<number | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(100);
  
  // Cost parameters
  const [wastePercentage, setWastePercentage] = useState<number>(5);
  const [fixedCostPerKg, setFixedCostPerKg] = useState<number>(1.5);
  
  // Material prices
  const [hdpePrice, setHdpePrice] = useState<number>(4.20);
  const [lldpePrice, setLldpePrice] = useState<number>(4.80);
  const [fillerPrice, setFillerPrice] = useState<number>(0.80);
  const [masterBatchPrice, setMasterBatchPrice] = useState<number>(10.0);
  
  // Material percentages
  const [hdpePercentage, setHdpePercentage] = useState<number>(30);
  const [lldpePercentage, setLldpePercentage] = useState<number>(20);
  const [fillerPercentage, setFillerPercentage] = useState<number>(48);
  const [masterBatchPercentage, setMasterBatchPercentage] = useState<number>(2);
  
  // Total percentage for validation
  const [totalPercentage, setTotalPercentage] = useState<number>(100);
  
  // Calculation result
  const [calculationResult, setCalculationResult] = useState<CostCalculationResult | null>(null);
  
  // Format number to locale string with 2 decimal places
  const formatNumberToLocale = (value: number, decimals: number = 2): string => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Calculate total percentage whenever material percentages change
  useEffect(() => {
    const total = hdpePercentage + lldpePercentage + fillerPercentage + masterBatchPercentage;
    setTotalPercentage(parseFloat(total.toFixed(2)));
  }, [hdpePercentage, lldpePercentage, fillerPercentage, masterBatchPercentage]);
  
  // Handle job order selection
  useEffect(() => {
    if (selectedJobOrderId && jobOrders) {
      const jobOrder = jobOrders.find(job => job.id === selectedJobOrderId);
      if (jobOrder) {
        calculateCost(jobOrder.quantity);
      }
    }
  }, [selectedJobOrderId, jobOrders]);
  
  // Manual calculation
  const calculateManualCost = () => {
    if (manualQuantity <= 0) {
      return;
    }
    calculateCost(manualQuantity);
  };
  
  // Calculate cost based on quantity
  const calculateCost = (quantity: number) => {
    // Validate total percentage is 100%
    if (Math.abs(totalPercentage - 100) > 0.1) {
      alert(t('cost_calculator.percentage_error'));
      return;
    }

    // Calculate total quantity including waste
    const totalQuantity = quantity * (1 + wastePercentage / 100);
    
    // Calculate material costs
    const hdpeQuantity = (quantity * hdpePercentage / 100);
    const lldpeQuantity = (quantity * lldpePercentage / 100);
    const fillerQuantity = (quantity * fillerPercentage / 100);
    const masterBatchQuantity = (quantity * masterBatchPercentage / 100);
    
    const hdpeCost = hdpeQuantity * hdpePrice;
    const lldpeCost = lldpeQuantity * lldpePrice;
    const fillerCost = fillerQuantity * fillerPrice;
    const masterBatchCost = masterBatchQuantity * masterBatchPrice;
    
    // Calculate waste cost
    const wasteQuantity = quantity * (wastePercentage / 100);
    const wasteCostPerKg = (hdpeCost + lldpeCost + fillerCost + masterBatchCost) / quantity;
    const wasteCost = wasteQuantity * wasteCostPerKg;
    
    // Calculate fixed cost
    const totalFixedCost = quantity * fixedCostPerKg;
    
    // Calculate total cost
    const totalMaterialCost = hdpeCost + lldpeCost + fillerCost + masterBatchCost;
    const totalCost = totalMaterialCost + wasteCost + totalFixedCost;
    const costPerKg = totalCost / quantity;
    
    // Create materials array
    const materials: MaterialCost[] = [
      { 
        name: "HDPE", 
        pricePerKg: hdpePrice, 
        percentage: hdpePercentage, 
        quantity: hdpeQuantity, 
        cost: hdpeCost 
      },
      { 
        name: "LLDPE", 
        pricePerKg: lldpePrice, 
        percentage: lldpePercentage, 
        quantity: lldpeQuantity, 
        cost: lldpeCost 
      },
      { 
        name: "Filler", 
        pricePerKg: fillerPrice, 
        percentage: fillerPercentage, 
        quantity: fillerQuantity, 
        cost: fillerCost 
      },
      { 
        name: "Masterbatch", 
        pricePerKg: masterBatchPrice, 
        percentage: masterBatchPercentage, 
        quantity: masterBatchQuantity, 
        cost: masterBatchCost 
      }
    ];
    
    // Set calculation result
    setCalculationResult({
      orderQuantity: quantity,
      wastePercentage,
      totalQuantity,
      wasteCost,
      fixedCostPerKg,
      totalFixedCost,
      totalMaterialCost,
      totalCost,
      costPerKg,
      materials
    });
  };

  // Handle print button click
  const handlePrint = () => {
    if (!calculationResult) return;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(t('common.popup_blocked'));
      return;
    }
    
    // Apply styles and content to print window
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('cost_calculator.title')} - ${t('cost_calculator.result')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 15px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .header-item { margin-bottom: 8px; }
            .label { font-size: 12px; color: #666; }
            .value { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            thead { background-color: #f3f4f6; }
            .material-row { background-color: #fef9c3; }
            .total-row { background-color: #f3f4f6; font-weight: bold; }
            .cost-cell { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 20px; font-size: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${t('cost_calculator.title')} - ${t('cost_calculator.result')}</h1>
          
          <div class="header">
            <div>
              <div class="header-item">
                <div class="label">${t('common.quantity')}</div>
                <div class="value">${calculationResult.orderQuantity} kg</div>
              </div>
              <div class="header-item">
                <div class="label">${t('cost_calculator.waste_percentage')}</div>
                <div class="value">${calculationResult.wastePercentage}%</div>
              </div>
            </div>
            <div>
              <div class="header-item">
                <div class="label">${t('cost_calculator.total_quantity')}</div>
                <div class="value">${Math.round(calculationResult.totalQuantity)} kg</div>
              </div>
              <div class="header-item">
                <div class="label">${t('cost_calculator.fixed_cost_per_kg')}</div>
                <div class="value">SAR ${calculationResult.fixedCostPerKg.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <h3>${t('cost_calculator.material_costs')}</h3>
          
          <table>
            <thead>
              <tr>
                <th>${t('common.material')}</th>
                <th>${t('cost_calculator.price_per_kg')}</th>
                <th>${t('common.percentage')}</th>
                <th>${t('common.quantity')} (kg)</th>
                <th>${t('cost_calculator.cost')} (SAR)</th>
              </tr>
            </thead>
            <tbody>
              ${calculationResult.materials.map(material => `
                <tr class="material-row">
                  <td>${material.name}</td>
                  <td>SAR ${material.pricePerKg.toFixed(2)}</td>
                  <td>${material.percentage}%</td>
                  <td>${Math.round(material.quantity)}</td>
                  <td class="cost-cell">SAR ${Math.round(material.cost)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">${t('cost_calculator.total_material_cost')}</td>
                <td>${calculationResult.orderQuantity}</td>
                <td class="cost-cell">SAR ${Math.round(calculationResult.totalMaterialCost)}</td>
              </tr>
              <tr>
                <td colspan="3">${t('cost_calculator.waste_cost')}</td>
                <td>${Math.round(calculationResult.orderQuantity * (calculationResult.wastePercentage / 100))}</td>
                <td class="cost-cell">SAR ${Math.round(calculationResult.wasteCost)}</td>
              </tr>
              <tr>
                <td colspan="3">${t('cost_calculator.fixed_cost')}</td>
                <td colspan="1"></td>
                <td class="cost-cell">SAR ${Math.round(calculationResult.totalFixedCost)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">${t('cost_calculator.total_cost')}</td>
                <td colspan="1"></td>
                <td class="cost-cell">SAR ${Math.round(calculationResult.totalCost)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">${t('cost_calculator.cost_per_kg')}</td>
                <td colspan="1"></td>
                <td class="cost-cell">SAR ${calculationResult.costPerKg.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            ${new Date().toLocaleString()}<br />
            ${t('cost_calculator.title')}
          </div>
        </body>
      </html>
    `);
    
    // Focus and print
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t('cost_calculator.job_order_selection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-order">{t('cost_calculator.select_job_order')}</Label>
                <Select
                  onValueChange={(value) => setSelectedJobOrderId(parseInt(value))}
                  disabled={jobOrdersLoading}
                >
                  <SelectTrigger id="job-order">
                    <SelectValue placeholder={t('cost_calculator.select_job_order')} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOrders && jobOrders.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        #{job.id} - ({job.quantity} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">{t('cost_calculator.manual_calculation')}</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="manual-quantity">{t('cost_calculator.quantity')}</Label>
                    <Input
                      id="manual-quantity"
                      type="number"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(parseFloat(e.target.value))}
                      min="1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={calculateManualCost}
                  >
                    {t('cost_calculator.calculate')}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">{t('cost_calculator.parameters')}</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="waste-percentage">{t('cost_calculator.waste_percentage')} (%)</Label>
                    <Input
                      id="waste-percentage"
                      type="number"
                      value={wastePercentage}
                      onChange={(e) => setWastePercentage(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fixed-cost">{t('cost_calculator.fixed_cost_per_kg')} (SAR)</Label>
                    <Input
                      id="fixed-cost"
                      type="number"
                      value={fixedCostPerKg}
                      onChange={(e) => setFixedCostPerKg(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">{t('cost_calculator.material_prices')} (SAR/kg)</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="hdpe-price">HDPE</Label>
                    <Input
                      id="hdpe-price"
                      type="number"
                      value={hdpePrice}
                      onChange={(e) => setHdpePrice(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lldpe-price">LLDPE</Label>
                    <Input
                      id="lldpe-price"
                      type="number"
                      value={lldpePrice}
                      onChange={(e) => setLldpePrice(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="filler-price">{t('cost_calculator.filler')}</Label>
                    <Input
                      id="filler-price"
                      type="number"
                      value={fillerPrice}
                      onChange={(e) => setFillerPrice(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mb-price">{t('cost_calculator.masterbatch')}</Label>
                    <Input
                      id="mb-price"
                      type="number"
                      value={masterBatchPrice}
                      onChange={(e) => setMasterBatchPrice(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">{t('cost_calculator.material_percentages')} (%)</h3>
                <div className={`text-xs mb-2 ${Math.abs(totalPercentage - 100) > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
                  {t('cost_calculator.total')}: {totalPercentage}% 
                  {Math.abs(totalPercentage - 100) > 0.1 ? ` (${t('cost_calculator.should_be')} 100%)` : ''}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="hdpe-percentage">HDPE</Label>
                    <Input
                      id="hdpe-percentage"
                      type="number"
                      value={hdpePercentage}
                      onChange={(e) => setHdpePercentage(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lldpe-percentage">LLDPE</Label>
                    <Input
                      id="lldpe-percentage"
                      type="number"
                      value={lldpePercentage}
                      onChange={(e) => setLldpePercentage(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="filler-percentage">{t('cost_calculator.filler')}</Label>
                    <Input
                      id="filler-percentage"
                      type="number"
                      value={fillerPercentage}
                      onChange={(e) => setFillerPercentage(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mb-percentage">{t('cost_calculator.masterbatch')}</Label>
                    <Input
                      id="mb-percentage"
                      type="number"
                      value={masterBatchPercentage}
                      onChange={(e) => setMasterBatchPercentage(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {calculationResult && (
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{t('cost_calculator.result')}</CardTitle>
                <CardDescription>{t('cost_calculator.calculation_description')}</CardDescription>
              </div>
              <Button onClick={handlePrint} variant="outline" size="sm">
                {t('common.print')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-2xl font-bold">{calculationResult.orderQuantity} kg</div>
                  <p className="text-sm text-muted-foreground">{t('common.quantity')}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-2xl font-bold">{calculationResult.wastePercentage}%</div>
                  <p className="text-sm text-muted-foreground">{t('cost_calculator.waste')}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(calculationResult.totalQuantity)} kg</div>
                  <p className="text-sm text-muted-foreground">{t('cost_calculator.total_quantity')}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-2xl font-bold">SAR {formatNumberToLocale(calculationResult.fixedCostPerKg)}</div>
                  <p className="text-sm text-muted-foreground">{t('cost_calculator.fixed_cost')}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">{t('cost_calculator.material_costs')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">{t('common.material')}</th>
                          <th className="border p-2 text-right">{t('cost_calculator.price')} (SAR/kg)</th>
                          <th className="border p-2 text-right">{t('common.percentage')}</th>
                          <th className="border p-2 text-right">{t('common.quantity')} (kg)</th>
                          <th className="border p-2 text-right">{t('cost_calculator.cost')} (SAR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculationResult.materials.map((material, index) => (
                          <tr key={index} className="even:bg-muted/50">
                            <td className="border p-2">{material.name}</td>
                            <td className="border p-2 text-right">{formatNumberToLocale(material.pricePerKg)}</td>
                            <td className="border p-2 text-right">{material.percentage}%</td>
                            <td className="border p-2 text-right">{Math.round(material.quantity)}</td>
                            <td className="border p-2 text-right">{formatNumberToLocale(material.cost, 0)}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted font-medium">
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.total_material_cost')}</td>
                          <td className="border p-2 text-right">{calculationResult.orderQuantity}</td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.totalMaterialCost, 0)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.waste_cost')}</td>
                          <td className="border p-2 text-right">{Math.round(calculationResult.orderQuantity * (calculationResult.wastePercentage / 100))}</td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.wasteCost, 0)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.fixed_cost')}</td>
                          <td className="border p-2 text-right"></td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.totalFixedCost, 0)}</td>
                        </tr>
                        <tr className="bg-muted font-bold">
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.total_cost')}</td>
                          <td className="border p-2 text-right"></td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.totalCost, 0)}</td>
                        </tr>
                        <tr className="bg-primary/10 font-bold">
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.cost_per_kg')}</td>
                          <td className="border p-2 text-right"></td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.costPerKg)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}