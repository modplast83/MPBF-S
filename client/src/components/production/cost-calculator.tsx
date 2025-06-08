import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { JobOrder, Customer, CustomerProduct, Item, Category } from "@shared/schema";

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

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch customer products
  const { data: customerProducts, isLoading: customerProductsLoading } = useQuery<CustomerProduct[]>({
    queryKey: ['/api/customer-products'],
  });

  // Fetch items
  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
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

  // Get customer name for a job order
  const getCustomerName = (jobOrder: JobOrder): string => {
    if (!customers) {
      return 'Loading...';
    }
    if (!jobOrder.customerId) {
      console.log('Job order missing customerId:', jobOrder);
      return 'No Customer ID';
    }
    const customer = customers.find(c => c.id === jobOrder.customerId);
    if (!customer) {
      console.log('Customer not found for ID:', jobOrder.customerId, 'Available customers:', customers.map(c => ({ id: c.id, name: c.name })));
    }
    return customer?.name || `Customer ID: ${jobOrder.customerId}`;
  };

  // Get customer product details for a job order
  const getCustomerProduct = (jobOrder: JobOrder): CustomerProduct | undefined => {
    return customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
  };

  // Get item name for a customer product
  const getItemName = (customerProduct: CustomerProduct): string => {
    if (!items) {
      return 'Loading...';
    }
    const item = items.find(i => i.id === customerProduct.itemId);
    return item?.name || `Item ID: ${customerProduct.itemId}`;
  };

  // Get category name for a customer product
  const getCategoryName = (customerProduct: CustomerProduct): string => {
    if (!items || !categories) {
      return 'Loading...';
    }
    const item = items.find(i => i.id === customerProduct.itemId);
    if (!item) return `Item ID: ${customerProduct.itemId}`;
    const category = categories.find(c => c.id === item.categoryId);
    return category?.name || `Category ID: ${item.categoryId}`;
  };

  // Calculate cost based on quantity
  const calculateCost = useCallback((quantity: number) => {
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
  }, [
    totalPercentage, 
    wastePercentage, 
    hdpePercentage, 
    lldpePercentage, 
    fillerPercentage, 
    masterBatchPercentage,
    hdpePrice, 
    lldpePrice, 
    fillerPrice, 
    masterBatchPrice, 
    fixedCostPerKg,
    t
  ]);

  // Get selected job order details
  const selectedJobOrder = selectedJobOrderId ? jobOrders?.find(job => job.id === selectedJobOrderId) : null;
  const selectedCustomerProduct = selectedJobOrder ? getCustomerProduct(selectedJobOrder) : null;
  
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
  }, [selectedJobOrderId, jobOrders, calculateCost]);
  
  // Manual calculation
  const calculateManualCost = () => {
    if (manualQuantity <= 0) {
      return;
    }
    calculateCost(manualQuantity);
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
                  disabled={jobOrdersLoading || customersLoading}
                >
                  <SelectTrigger id="job-order">
                    <SelectValue placeholder={
                      jobOrdersLoading || customersLoading 
                        ? t('common.loading') + '...' 
                        : t('cost_calculator.select_job_order')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOrders && jobOrders.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        #{job.id} - {getCustomerName(job)} ({job.quantity} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Display selected job order details */}
              {selectedJobOrder && selectedCustomerProduct && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">{t('cost_calculator.job_order_details')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('cost_calculator.customer')}:</span>
                      <span className="font-medium">{getCustomerName(selectedJobOrder)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('cost_calculator.item')}:</span>
                      <span className="font-medium">{getItemName(selectedCustomerProduct)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('cost_calculator.category')}:</span>
                      <span className="font-medium">{getCategoryName(selectedCustomerProduct)}</span>
                    </div>
                    {selectedCustomerProduct.sizeCaption && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('cost_calculator.size')}:</span>
                        <span className="font-medium">{selectedCustomerProduct.sizeCaption}</span>
                      </div>
                    )}
                    {selectedCustomerProduct.width && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('cost_calculator.width')}:</span>
                        <span className="font-medium">{selectedCustomerProduct.width} cm</span>
                      </div>
                    )}
                    {selectedCustomerProduct.thickness && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('cost_calculator.thickness')}:</span>
                        <span className="font-medium">{selectedCustomerProduct.thickness} micron</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.quantity')}:</span>
                      <span className="font-medium">{selectedJobOrder.quantity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.status')}:</span>
                      <Badge variant={selectedJobOrder.status === 'pending' ? 'secondary' : 'default'}>
                        {t(`status.${selectedJobOrder.status}`)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('cost_calculator.manual_calculation')}</CardTitle>
            <CardDescription>
              {t('cost_calculator.manual_calculation_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Manual Quantity Input */}
              <div>
                <Label htmlFor="manual-quantity">{t('cost_calculator.quantity')} (kg)</Label>
                <Input
                  id="manual-quantity"
                  type="number"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="1"
                />
              </div>

              {/* Cost Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waste-percentage">{t('cost_calculator.waste_percentage')} (%)</Label>
                  <Input
                    id="waste-percentage"
                    type="number"
                    value={wastePercentage}
                    onChange={(e) => setWastePercentage(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="fixed-cost">{t('cost_calculator.fixed_cost_per_kg')} (SAR)</Label>
                  <Input
                    id="fixed-cost"
                    type="number"
                    value={fixedCostPerKg}
                    onChange={(e) => setFixedCostPerKg(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Material Prices */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('cost_calculator.material_prices')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hdpe-price">HDPE {t('cost_calculator.price')} (SAR/kg)</Label>
                    <Input
                      id="hdpe-price"
                      type="number"
                      value={hdpePrice}
                      onChange={(e) => setHdpePrice(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lldpe-price">LLDPE {t('cost_calculator.price')} (SAR/kg)</Label>
                    <Input
                      id="lldpe-price"
                      type="number"
                      value={lldpePrice}
                      onChange={(e) => setLldpePrice(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filler-price">{t('cost_calculator.filler')} {t('cost_calculator.price')} (SAR/kg)</Label>
                    <Input
                      id="filler-price"
                      type="number"
                      value={fillerPrice}
                      onChange={(e) => setFillerPrice(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="masterbatch-price">{t('cost_calculator.masterbatch')} {t('cost_calculator.price')} (SAR/kg)</Label>
                    <Input
                      id="masterbatch-price"
                      type="number"
                      value={masterBatchPrice}
                      onChange={(e) => setMasterBatchPrice(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Material Percentages */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('cost_calculator.material_percentages')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hdpe-percentage">HDPE (%)</Label>
                    <Input
                      id="hdpe-percentage"
                      type="number"
                      value={hdpePercentage}
                      onChange={(e) => setHdpePercentage(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lldpe-percentage">LLDPE (%)</Label>
                    <Input
                      id="lldpe-percentage"
                      type="number"
                      value={lldpePercentage}
                      onChange={(e) => setLldpePercentage(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filler-percentage">{t('cost_calculator.filler')} (%)</Label>
                    <Input
                      id="filler-percentage"
                      type="number"
                      value={fillerPercentage}
                      onChange={(e) => setFillerPercentage(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="masterbatch-percentage">{t('cost_calculator.masterbatch')} (%)</Label>
                    <Input
                      id="masterbatch-percentage"
                      type="number"
                      value={masterBatchPercentage}
                      onChange={(e) => setMasterBatchPercentage(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                
                {/* Total Percentage Indicator */}
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('cost_calculator.total_percentage')}:</span>
                    <span className={`text-sm font-bold ${Math.abs(totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPercentage}%
                    </span>
                  </div>
                  {Math.abs(totalPercentage - 100) > 0.1 && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('cost_calculator.percentage_warning')}
                    </p>
                  )}
                </div>
              </div>

              {/* Calculate Button */}
              <div className="flex gap-2">
                <Button onClick={calculateManualCost} className="flex-1">
                  {t('cost_calculator.calculate')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>{t('cost_calculator.calculation_results')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">{t('cost_calculator.total_quantity')}</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {Math.round(calculationResult.totalQuantity)} kg
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">{t('cost_calculator.material_cost')}</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    SAR {formatNumberToLocale(calculationResult.totalMaterialCost, 0)}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 dark:text-orange-400">{t('cost_calculator.total_cost')}</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    SAR {formatNumberToLocale(calculationResult.totalCost, 0)}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">{t('cost_calculator.cost_per_kg')}</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    SAR {formatNumberToLocale(calculationResult.costPerKg)}
                  </div>
                </div>
              </div>

              {/* Detailed Results Table */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('cost_calculator.detailed_breakdown')}</h3>
                <div className="border rounded-lg overflow-hidden">
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
                        <tr className="bg-blue-50 dark:bg-blue-950">
                          <td className="border p-2 font-semibold" colSpan={3}>{t('cost_calculator.total_material_cost')}</td>
                          <td className="border p-2 text-right">{calculationResult.orderQuantity}</td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.totalMaterialCost, 0)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.waste_cost')} ({calculationResult.wastePercentage}%)</td>
                          <td className="border p-2 text-right">{Math.round(calculationResult.orderQuantity * (calculationResult.wastePercentage / 100))}</td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.wasteCost, 0)}</td>
                        </tr>
                        <tr>
                          <td className="border p-2" colSpan={3}>{t('cost_calculator.fixed_cost')}</td>
                          <td className="border p-2 text-right"></td>
                          <td className="border p-2 text-right">{formatNumberToLocale(calculationResult.totalFixedCost, 0)}</td>
                        </tr>
                        <tr className="bg-primary/10 font-bold">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}