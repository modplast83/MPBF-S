import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS } from "@/lib/constants";
import { JobOrder, Customer, CustomerProduct } from "@shared/schema";
import { formatDateString } from "@/lib/utils";

interface AbaCalculatorProps {
  onPrint: (data: AbaCalculationResult) => void;
}

interface AbaCalculationResult {
  mixId: string;
  mixDate: string;
  customer: string;
  quantity: number;
  rawMaterial: string;
  items: AbaCalculationItem[];
  totals: {
    screwA: number;
    screwB: number;
    total: number;
    screwAPercentage: number;
    screwBPercentage: number;
    screwAAbsPercentage: number; // A% of total quantity
    screwBAbsPercentage: number; // B% of total quantity
  };
  batches?: AbaCalculationBatch[]; // Multiple batches if quantity > 900kg
}

interface AbaCalculationBatch {
  batchNumber: number;
  quantity: number;
  items: AbaCalculationItem[];
  totals: {
    screwA: number;
    screwB: number;
    total: number;
  };
}

interface AbaCalculationItem {
  material: string;
  screwA: number;
  screwB: number;
  total: number;
  percentage: number;
  screwAPercentage: number;
  screwBPercentage: number;
  screwAAbsPercentage: number; // A% of total quantity
  screwBAbsPercentage: number; // B% of total quantity
}

export function AbaCalculator({ onPrint }: AbaCalculatorProps) {
  const { t } = useTranslation();
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<AbaCalculationResult | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(1000);

  // Fetch all pending and in_progress job orders
  const { data: jobOrders, isLoading: jobOrdersLoading } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  // Fetch all customer products
  const { data: customerProducts, isLoading: customerProductsLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
    enabled: !!selectedJobOrderId,
  });

  // Fetch all customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
    enabled: !!selectedJobOrderId && !!customerProducts,
  });

  // Filter job orders for pending and in_progress status
  const pendingJobOrders = jobOrders?.filter(job => 
    job.status === "pending" || job.status === "in_progress"
  ) || [];

  // Get customer name for a job order
  const getCustomerName = (jobOrder: JobOrder): string => {
    // If customerId is directly on the job order, use it
    if (jobOrder.customerId && customers) {
      const customer = customers.find(c => c.id === jobOrder.customerId);
      if (customer) return customer.name;
    }

    // Otherwise, try to get customer through customer product relation
    if (customerProducts && customers) {
      const customerProduct = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
      if (customerProduct) {
        const customer = customers.find(c => c.id === customerProduct.customerId);
        if (customer) return customer.name;
      }
    }

    return "Unknown Customer";
  };

  // Get raw material for a job order
  const getRawMaterial = (jobOrder: JobOrder): string => {
    if (!customerProducts) return "Unknown";
    
    const product = customerProducts.find(cp => cp.id === jobOrder.customerProductId);
    if (!product) return "Unknown";
    
    return product.rawMaterial || "Unknown";
  };

  // Calculate ABA formula when job order is selected
  useEffect(() => {
    if (!selectedJobOrderId || !jobOrders || jobOrdersLoading || customerProductsLoading || customersLoading) {
      return;
    }

    const selectedOrder = jobOrders.find(job => job.id === selectedJobOrderId);
    if (!selectedOrder) return;

    calculateAbaFormula(selectedOrder);
  }, [selectedJobOrderId, jobOrders, jobOrdersLoading, customerProductsLoading, customersLoading]);

  const calculateAbaFormula = (jobOrder: JobOrder) => {
    // Get raw material type and quantity
    const rawMaterial = getRawMaterial(jobOrder);
    const quantity = jobOrder.quantity;
    const customer = getCustomerName(jobOrder);
    
    const MAX_BATCH_SIZE = 900; // Maximum batch size in kg

    // For quantities <= 900kg, we use a simpler calculation
    if (quantity <= MAX_BATCH_SIZE) {
      const singleBatch = calculateSingleBatch(quantity);
      
      setCalculationResult({
        mixId: `Mix${String(jobOrder.id).padStart(3, '0')}`,
        mixDate: formatDateString(new Date().toISOString()),
        customer,
        quantity,
        rawMaterial,
        items: singleBatch.items,
        totals: {
          screwA: singleBatch.totals.screwA,
          screwB: singleBatch.totals.screwB,
          total: singleBatch.totals.total,
          screwAPercentage: 30,
          screwBPercentage: 70,
          screwAAbsPercentage: 30,
          screwBAbsPercentage: 70
        }
      });
      return;
    }
    
    // For quantities > 900kg, we need multiple batches
    const fullBatchCount = Math.floor(quantity / MAX_BATCH_SIZE);
    const remainingQuantity = quantity % MAX_BATCH_SIZE;
    const totalBatches = remainingQuantity > 0 ? fullBatchCount + 1 : fullBatchCount;
    
    const batches: AbaCalculationBatch[] = [];
    
    // Create full 900kg batches
    for (let i = 0; i < fullBatchCount; i++) {
      batches.push(calculateSingleBatch(MAX_BATCH_SIZE, i + 1));
    }
    
    // Create the final partial batch if needed
    if (remainingQuantity > 0) {
      batches.push(calculateSingleBatch(remainingQuantity, totalBatches));
    }
    
    // Calculate overall totals
    const totalScrewA = batches.reduce((sum, batch) => sum + batch.totals.screwA, 0);
    const totalScrewB = batches.reduce((sum, batch) => sum + batch.totals.screwB, 0);
    const total = totalScrewA + totalScrewB;
    
    // Create aggregated items based on the formula
    // but scale them to the total quantity
    const scaleFactor = quantity > 0 ? quantity / 100 : 0;
    
    // HDPE
    const hdpeScrewA = 13 * scaleFactor;
    const hdpeScrewB = 13 * scaleFactor;
    const hdpeTotal = hdpeScrewA + hdpeScrewB;
    const hdpePercentage = quantity > 0 ? (hdpeTotal / quantity) * 100 : 0;

    // LLDPE
    const lldpeScrewA = 12 * scaleFactor;
    const lldpeScrewB = 10 * scaleFactor;
    const lldpeTotal = lldpeScrewA + lldpeScrewB;
    const lldpePercentage = quantity > 0 ? (lldpeTotal / quantity) * 100 : 0;

    // Filler
    const fillerScrewA = 5 * scaleFactor;
    const fillerScrewB = 46 * scaleFactor;
    const fillerTotal = fillerScrewA + fillerScrewB;
    const fillerPercentage = quantity > 0 ? (fillerTotal / quantity) * 100 : 0;

    // Masterbatch
    const mbScrewA = 1 * scaleFactor;
    const mbScrewB = 1 * scaleFactor;
    const mbTotal = mbScrewA + mbScrewB;
    const mbPercentage = (mbTotal / quantity) * 100;

    const items: AbaCalculationItem[] = [
      {
        material: "HDPE",
        screwA: Math.round(hdpeScrewA),
        screwB: Math.round(hdpeScrewB),
        total: Math.round(hdpeTotal),
        percentage: Number(hdpePercentage.toFixed(1)),
        screwAPercentage: 50,
        screwBPercentage: 50,
        screwAAbsPercentage: 12.9,
        screwBAbsPercentage: 13.3
      },
      {
        material: "LLDPE",
        screwA: Math.round(lldpeScrewA),
        screwB: Math.round(lldpeScrewB),
        total: Math.round(lldpeTotal),
        percentage: Number(lldpePercentage.toFixed(1)),
        screwAPercentage: 54.5,
        screwBPercentage: 45.5,
        screwAAbsPercentage: 12.0,
        screwBAbsPercentage: 9.8
      },
      {
        material: "Filler",
        screwA: Math.round(fillerScrewA),
        screwB: Math.round(fillerScrewB),
        total: Math.round(fillerTotal),
        percentage: Number(fillerPercentage.toFixed(1)),
        screwAPercentage: 9.8,
        screwBPercentage: 90.2,
        screwAAbsPercentage: 4.5,
        screwBAbsPercentage: 45.5
      },
      {
        material: "MasterBatch",
        screwA: Math.round(mbScrewA),
        screwB: Math.round(mbScrewB),
        total: Math.round(mbTotal),
        percentage: Number(mbPercentage.toFixed(1)),
        screwAPercentage: 0,
        screwBPercentage: 100,
        screwAAbsPercentage: 0.6,
        screwBAbsPercentage: 1.4
      }
    ];
    
    setCalculationResult({
      mixId: `Mix${String(jobOrder.id).padStart(3, '0')}`,
      mixDate: formatDateString(new Date().toISOString()),
      customer,
      quantity,
      rawMaterial,
      items,
      totals: {
        screwA: Math.round(totalScrewA),
        screwB: Math.round(totalScrewB),
        total: Math.round(total),
        screwAPercentage: 30,
        screwBPercentage: 70,
        screwAAbsPercentage: 30,
        screwBAbsPercentage: 70
      },
      batches
    });
  };

  // Function to calculate ABA for a single batch with max 900kg
  const calculateSingleBatch = (quantity: number, batchNumber: number = 1): AbaCalculationBatch => {
    // Always 30% to Screw A and 70% to Screw B
    const totalScrewA = quantity * 0.3; // 30% of total
    const totalScrewB = quantity * 0.7; // 70% of total
    const total = totalScrewA + totalScrewB; // Should equal quantity

    // Scale factor based on 100kg example
    const scaleFactor = quantity / 100;

    // HDPE - exact values from example image
    const hdpeScrewA = 13 * scaleFactor; // 13 kg for A in 100kg example
    const hdpeScrewB = 13 * scaleFactor; // 13 kg for B in 100kg example
    const hdpeTotal = hdpeScrewA + hdpeScrewB;
    const hdpePercentage = (hdpeTotal / quantity) * 100;

    // LLDPE - exact values from example image
    const lldpeScrewA = 12 * scaleFactor; // 12 kg for A in 100kg example
    const lldpeScrewB = 10 * scaleFactor; // 10 kg for B in 100kg example
    const lldpeTotal = lldpeScrewA + lldpeScrewB;
    const lldpePercentage = (lldpeTotal / quantity) * 100;

    // Filler - exact values from example image
    const fillerScrewA = 5 * scaleFactor; // 5 kg for A in 100kg example
    const fillerScrewB = 46 * scaleFactor; // 46 kg for B in 100kg example
    const fillerTotal = fillerScrewA + fillerScrewB;
    const fillerPercentage = (fillerTotal / quantity) * 100;

    // Masterbatch - exact values from example image
    const mbScrewA = 1 * scaleFactor; // 1 kg for A in 100kg example
    const mbScrewB = 1 * scaleFactor; // 1 kg for B in 100kg example
    const mbTotal = mbScrewA + mbScrewB;
    const mbPercentage = (mbTotal / quantity) * 100;

    // Create the items array based on the example formula
    const items: AbaCalculationItem[] = [
      {
        material: "HDPE",
        screwA: Math.round(hdpeScrewA),
        screwB: Math.round(hdpeScrewB),
        total: Math.round(hdpeTotal),
        percentage: Number((hdpePercentage).toFixed(1)),
        screwAPercentage: 50, // % of this material in screw A
        screwBPercentage: 50, // % of this material in screw B
        screwAAbsPercentage: 12.9, // % of total quantity in screw A
        screwBAbsPercentage: 13.3  // % of total quantity in screw B
      },
      {
        material: "LLDPE",
        screwA: Math.round(lldpeScrewA),
        screwB: Math.round(lldpeScrewB),
        total: Math.round(lldpeTotal),
        percentage: Number((lldpePercentage).toFixed(1)),
        screwAPercentage: 54.5, // % of this material in screw A
        screwBPercentage: 45.5, // % of this material in screw B
        screwAAbsPercentage: 12.0, // % of total quantity in screw A
        screwBAbsPercentage: 9.8   // % of total quantity in screw B
      },
      {
        material: "Filler",
        screwA: Math.round(fillerScrewA),
        screwB: Math.round(fillerScrewB),
        total: Math.round(fillerTotal),
        percentage: Number((fillerPercentage).toFixed(1)),
        screwAPercentage: 9.8,  // % of this material in screw A
        screwBPercentage: 90.2, // % of this material in screw B
        screwAAbsPercentage: 4.5,  // % of total quantity in screw A
        screwBAbsPercentage: 45.5  // % of total quantity in screw B
      },
      {
        material: "MasterBatch",
        screwA: Math.round(mbScrewA),
        screwB: Math.round(mbScrewB),
        total: Math.round(mbTotal),
        percentage: Number((mbPercentage).toFixed(1)),
        screwAPercentage: 0,   // % of this material in screw A
        screwBPercentage: 100, // % of this material in screw B
        screwAAbsPercentage: 0.6, // % of total quantity in screw A
        screwBAbsPercentage: 1.4  // % of total quantity in screw B
      }
    ];

    return {
      batchNumber,
      quantity,
      items,
      totals: {
        screwA: Math.round(totalScrewA),
        screwB: Math.round(totalScrewB),
        total: Math.round(total)
      }
    };
  };

  // Calculate ABA formula for manual quantity
  const calculateManualAba = () => {
    if (!manualQuantity || manualQuantity <= 0) return;

    const MAX_BATCH_SIZE = 900; // Maximum batch size in kg
    
    // Calculate how many batches we need
    const fullBatchCount = Math.floor(manualQuantity / MAX_BATCH_SIZE);
    const remainingQuantity = manualQuantity % MAX_BATCH_SIZE;
    const totalBatches = remainingQuantity > 0 ? fullBatchCount + 1 : fullBatchCount;

    // If quantity is <= 900kg, we just need a single batch
    if (manualQuantity <= MAX_BATCH_SIZE) {
      const singleBatch = calculateSingleBatch(manualQuantity);
      
      setCalculationResult({
        mixId: `Mix${String(0).padStart(3, '0')}`,
        mixDate: formatDateString(new Date().toISOString()),
        customer: "Manual Calculation",
        quantity: manualQuantity,
        rawMaterial: "HDPE",
        items: singleBatch.items,
        totals: {
          screwA: singleBatch.totals.screwA,
          screwB: singleBatch.totals.screwB,
          total: singleBatch.totals.total,
          screwAPercentage: 30,
          screwBPercentage: 70,
          screwAAbsPercentage: 30,
          screwBAbsPercentage: 70
        }
      });
      return;
    }

    // For quantities > 900kg, we need multiple batches
    const batches: AbaCalculationBatch[] = [];
    
    // Create full 900kg batches
    for (let i = 0; i < fullBatchCount; i++) {
      batches.push(calculateSingleBatch(MAX_BATCH_SIZE, i + 1));
    }
    
    // Create the final partial batch if needed
    if (remainingQuantity > 0) {
      batches.push(calculateSingleBatch(remainingQuantity, totalBatches));
    }

    // Calculate overall totals
    const totalScrewA = batches.reduce((sum, batch) => sum + batch.totals.screwA, 0);
    const totalScrewB = batches.reduce((sum, batch) => sum + batch.totals.screwB, 0);
    const total = totalScrewA + totalScrewB;

    // Create aggregated items based on the first batch
    // but scale them to the total quantity
    const scaleFactor = manualQuantity / 100;
    
    // HDPE
    const hdpeScrewA = 13 * scaleFactor;
    const hdpeScrewB = 13 * scaleFactor;
    const hdpeTotal = hdpeScrewA + hdpeScrewB;
    const hdpePercentage = (hdpeTotal / manualQuantity) * 100;

    // LLDPE
    const lldpeScrewA = 12 * scaleFactor;
    const lldpeScrewB = 10 * scaleFactor;
    const lldpeTotal = lldpeScrewA + lldpeScrewB;
    const lldpePercentage = (lldpeTotal / manualQuantity) * 100;

    // Filler
    const fillerScrewA = 5 * scaleFactor;
    const fillerScrewB = 46 * scaleFactor;
    const fillerTotal = fillerScrewA + fillerScrewB;
    const fillerPercentage = (fillerTotal / manualQuantity) * 100;

    // Masterbatch
    const mbScrewA = 1 * scaleFactor;
    const mbScrewB = 1 * scaleFactor;
    const mbTotal = mbScrewA + mbScrewB;
    const mbPercentage = (mbTotal / manualQuantity) * 100;

    const items: AbaCalculationItem[] = [
      {
        material: "HDPE",
        screwA: Math.round(hdpeScrewA),
        screwB: Math.round(hdpeScrewB),
        total: Math.round(hdpeTotal),
        percentage: Number(hdpePercentage.toFixed(1)),
        screwAPercentage: 50,
        screwBPercentage: 50,
        screwAAbsPercentage: 12.9,
        screwBAbsPercentage: 13.3
      },
      {
        material: "LLDPE",
        screwA: Math.round(lldpeScrewA),
        screwB: Math.round(lldpeScrewB),
        total: Math.round(lldpeTotal),
        percentage: Number(lldpePercentage.toFixed(1)),
        screwAPercentage: 54.5,
        screwBPercentage: 45.5,
        screwAAbsPercentage: 12.0,
        screwBAbsPercentage: 9.8
      },
      {
        material: "Filler",
        screwA: Math.round(fillerScrewA),
        screwB: Math.round(fillerScrewB),
        total: Math.round(fillerTotal),
        percentage: Number(fillerPercentage.toFixed(1)),
        screwAPercentage: 9.8,
        screwBPercentage: 90.2,
        screwAAbsPercentage: 4.5,
        screwBAbsPercentage: 45.5
      },
      {
        material: "MasterBatch",
        screwA: Math.round(mbScrewA),
        screwB: Math.round(mbScrewB),
        total: Math.round(mbTotal),
        percentage: Number(mbPercentage.toFixed(1)),
        screwAPercentage: 0,
        screwBPercentage: 100,
        screwAAbsPercentage: 0.6,
        screwBAbsPercentage: 1.4
      }
    ];

    setCalculationResult({
      mixId: `Mix${String(0).padStart(3, '0')}`,
      mixDate: formatDateString(new Date().toISOString()),
      customer: "Manual Calculation",
      quantity: manualQuantity,
      rawMaterial: "HDPE",
      items,
      totals: {
        screwA: Math.round(totalScrewA),
        screwB: Math.round(totalScrewB),
        total: Math.round(total),
        screwAPercentage: 30,
        screwBPercentage: 70,
        screwAAbsPercentage: 30,
        screwBAbsPercentage: 70
      },
      batches // Include the batches in the result
    });
  };

  // Handle print button click
  const handlePrint = () => {
    if (!calculationResult) return;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(t('production.roll_management.popup_blocked'));
      return;
    }
    
    // Generate batch tables HTML if batches exist
    let batchesHtml = '';
    if (calculationResult.batches && calculationResult.batches.length > 1) {
      batchesHtml = calculationResult.batches.map(batch => `
        <div class="batch-container">
          <h3>${t('production.aba_calculator.batch', 'Batch')} ${batch.batchNumber} - ${batch.quantity} kg</h3>
          <table>
            <thead>
              <tr>
                <th>A</th>
                <th>Material</th>
                <th>B</th>
                <th>A+B KG</th>
                <th>A+B %</th>
                <th>A%</th>
                <th>B%</th>
                <th class="text-orange-500">A%</th>
                <th class="text-teal-500">B%</th>
              </tr>
            </thead>
            <tbody>
              ${batch.items.map(item => `
                <tr>
                  <td class="screwA">${item.screwA} KG</td>
                  <td class="material">${item.material}</td>
                  <td class="screwB">${item.screwB} KG</td>
                  <td class="total">${item.total} KG</td>
                  <td>${item.percentage}%</td>
                  <td>${item.screwAPercentage}%</td>
                  <td>${item.screwBPercentage}%</td>
                  <td class="text-orange-500">${item.screwAAbsPercentage}%</td>
                  <td class="text-teal-500">${item.screwBAbsPercentage}%</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>${batch.totals.screwA} KG</td>
                <td>Total</td>
                <td>${batch.totals.screwB} KG</td>
                <td>${batch.totals.total} KG</td>
                <td>100%</td>
                <td>30%</td>
                <td>70%</td>
                <td class="text-orange-500">30%</td>
                <td class="text-teal-500">70%</td>
              </tr>
            </tbody>
          </table>
        </div>
      `).join('<div class="batch-separator"></div>');
    }
    
    // Apply styles and content to print window
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('production.aba_calculator.title')} - ${calculationResult.mixId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 15px; }
            h2 { font-size: 16px; margin-top: 25px; }
            h3 { font-size: 14px; margin-top: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .header-item { margin-bottom: 8px; }
            .label { font-size: 12px; color: #666; }
            .value { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            thead { background-color: #f3f4f6; }
            .total-row { background-color: #f3f4f6; font-weight: bold; }
            .screwA { background-color: #fee2e2; }
            .screwB { background-color: #fef3c7; }
            .material { background-color: #fef9c3; font-weight: 500; }
            .total { background-color: #fefce8; }
            .footer { margin-top: 20px; font-size: 10px; text-align: center; }
            .batch-container { margin-top: 30px; page-break-inside: avoid; }
            .batch-separator { height: 20px; }
            .batch-note { font-size: 12px; color: #555; font-style: italic; margin-top: 10px; }
            @media print {
              .batch-separator { height: 10px; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <h1>${t('production.aba_calculator.title')} - ${t('production.aba_calculator.result')}</h1>
          
          <div class="header">
            <div>
              <div class="header-item">
                <div class="label">${t('production.aba_calculator.mix_id')}</div>
                <div class="value">${calculationResult.mixId}</div>
              </div>
              <div class="header-item">
                <div class="label">${t('common.customer')}</div>
                <div class="value">${calculationResult.customer}</div>
              </div>
            </div>
            <div>
              <div class="header-item">
                <div class="label">${t('production.aba_calculator.date')}</div>
                <div class="value">${calculationResult.mixDate}</div>
              </div>
              <div class="header-item">
                <div class="label">${t('common.quantity')}</div>
                <div class="value">${calculationResult.quantity} kg</div>
              </div>
            </div>
          </div>
          
          <div class="header-item">
            <div class="label">${t('common.raw_material')}</div>
            <div class="value">${calculationResult.rawMaterial}</div>
          </div>
          
          <h3>${calculationResult.batches && calculationResult.batches.length > 1 
            ? t('production.aba_calculator.aba_summary', 'ABA Formula - Summary') 
            : t('production.aba_calculator.aba_formula', 'ABA Formula')}</h3>
          
          <table>
            <thead>
              <tr>
                <th>A</th>
                <th>Material</th>
                <th>B</th>
                <th>A+B KG</th>
                <th>A+B %</th>
                <th>A%</th>
                <th>B%</th>
                <th class="text-orange-500">A%</th>
                <th class="text-teal-500">B%</th>
              </tr>
            </thead>
            <tbody>
              ${calculationResult.items.map((item, idx) => `
                <tr>
                  <td class="screwA">${item.screwA} KG</td>
                  <td class="material">${item.material}</td>
                  <td class="screwB">${item.screwB} KG</td>
                  <td class="total">${item.total} KG</td>
                  <td>${item.percentage}%</td>
                  <td>${item.screwAPercentage}%</td>
                  <td>${item.screwBPercentage}%</td>
                  <td class="text-orange-500">${item.screwAAbsPercentage}%</td>
                  <td class="text-teal-500">${item.screwBAbsPercentage}%</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>${calculationResult.totals.screwA} KG</td>
                <td>Total</td>
                <td>${calculationResult.totals.screwB} KG</td>
                <td>${calculationResult.totals.total} KG</td>
                <td>100%</td>
                <td>${calculationResult.totals.screwAPercentage}%</td>
                <td>${calculationResult.totals.screwBPercentage}%</td>
                <td class="text-orange-500">${calculationResult.totals.screwAAbsPercentage}%</td>
                <td class="text-teal-500">${calculationResult.totals.screwBAbsPercentage}%</td>
              </tr>
            </tbody>
          </table>
          
          ${calculationResult.batches && calculationResult.batches.length > 1 ? `
            <div class="batch-note">
              ${t('production.aba_calculator.batch_note', 'Note: This quantity exceeds the maximum 900kg per mixing formula. The calculation has been divided into the following batches:')}
            </div>
            ${batchesHtml}
          ` : ''}
          
          <div class="footer">
            ${new Date().toLocaleString()}<br />
            ${t('production.aba_calculator.title')} - ${calculationResult.mixId}
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
            <CardTitle>{t('production.aba_calculator.job_order_selection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-order">{t('production.aba_calculator.select_job_order')}</Label>
                <Select
                  onValueChange={(value) => setSelectedJobOrderId(parseInt(value))}
                  disabled={jobOrdersLoading}
                >
                  <SelectTrigger id="job-order">
                    <SelectValue placeholder={t('production.aba_calculator.select_job_order')} />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingJobOrders.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        #{job.id} - {getCustomerName(job)} ({job.quantity} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">{t('production.aba_calculator.manual_calculation')}</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="manual-quantity">{t('production.aba_calculator.quantity')}</Label>
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
                    onClick={calculateManualAba}
                  >
                    {t('production.aba_calculator.calculate')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {calculationResult && (
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('production.aba_calculator.result')}</CardTitle>
              <Button onClick={handlePrint} variant="outline" size="sm" className="ml-auto">
                <span className="material-icons text-sm mr-1">print</span>
                {t('common.print')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('production.aba_calculator.mix_id')}</p>
                    <p className="font-medium">{calculationResult.mixId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('production.aba_calculator.date')}</p>
                    <p className="font-medium">{calculationResult.mixDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.customer')}</p>
                    <p className="font-medium">{calculationResult.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.quantity')}</p>
                    <p className="font-medium">{calculationResult.quantity} kg</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{t('common.raw_material')}</p>
                    <p className="font-medium">{calculationResult.rawMaterial}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">
                    {calculationResult.batches && calculationResult.batches.length > 1 
                      ? t('production.aba_calculator.aba_summary', 'ABA Formula - Summary') 
                      : t('production.aba_calculator.aba_formula', 'ABA Formula')}
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="text-center">
                          <th className="p-2 border text-sm font-medium bg-red-200">
                            Screw A
                          </th>
                          <th className="p-2 border text-sm font-medium bg-yellow-100">
                            Raw Materials
                          </th>
                          <th className="p-2 border text-sm font-medium bg-orange-200">
                            Screw B
                          </th>
                          <th className="p-2 border text-sm font-medium bg-yellow-200">
                            A+B Kg
                          </th>
                          <th className="p-2 border text-sm font-medium bg-yellow-50">
                            A+B %
                          </th>
                          <th className="p-2 border text-sm font-medium">
                            A %
                          </th>
                          <th className="p-2 border text-sm font-medium">
                            B %
                          </th>
                          <th className="p-2 border text-sm font-medium text-orange-500">
                            A %
                          </th>
                          <th className="p-2 border text-sm font-medium text-teal-500">
                            B %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculationResult.items.map((item, index) => (
                          <tr key={index} className="text-center">
                            <td className="p-2 border text-sm bg-red-100">{item.screwA} KG</td>
                            <td className="p-2 border text-sm font-medium bg-yellow-50">{item.material}</td>
                            <td className="p-2 border text-sm bg-orange-100">{item.screwB} KG</td>
                            <td className="p-2 border text-sm bg-yellow-50">{item.total} KG</td>
                            <td className="p-2 border text-sm">{item.percentage}%</td>
                            <td className="p-2 border text-sm">{item.screwAPercentage}%</td>
                            <td className="p-2 border text-sm">{item.screwBPercentage}%</td>
                            <td className="p-2 border text-sm text-orange-500">{item.screwAAbsPercentage}%</td>
                            <td className="p-2 border text-sm text-teal-500">{item.screwBAbsPercentage}%</td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr className="bg-gray-200 text-center">
                          <td className="p-2 border text-sm font-bold">
                            {calculationResult.totals.screwA} KG
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            {t('common.total')}
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            {calculationResult.totals.screwB} KG
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            {calculationResult.totals.total} KG
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            100%
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            {calculationResult.totals.screwAPercentage}%
                          </td>
                          <td className="p-2 border text-sm font-bold">
                            {calculationResult.totals.screwBPercentage}%
                          </td>
                          <td className="p-2 border text-sm font-bold text-orange-500">
                            30%
                          </td>
                          <td className="p-2 border text-sm font-bold text-teal-500">
                            70%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Batch information for quantities > 900kg */}
                  {calculationResult.batches && calculationResult.batches.length > 1 && (
                    <div className="mt-6">
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                        <p className="text-amber-800 text-sm">
                          {t('production.aba_calculator.batch_note', 'Note: This quantity exceeds the maximum 900kg per mixing formula. The calculation has been divided into the following batches:')}
                        </p>
                      </div>
                      
                      {calculationResult.batches.map((batch, batchIndex) => (
                        <div key={batchIndex} className="mb-6 border rounded-md p-3">
                          <h4 className="font-medium mb-2 text-slate-700">
                            {t('production.aba_calculator.batch', 'Batch')} {batch.batchNumber} - {batch.quantity} kg
                          </h4>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                              <thead>
                                <tr className="text-center">
                                  <th className="p-2 border text-sm font-medium bg-red-200">
                                    Screw A
                                  </th>
                                  <th className="p-2 border text-sm font-medium bg-yellow-100">
                                    Raw Materials
                                  </th>
                                  <th className="p-2 border text-sm font-medium bg-orange-200">
                                    Screw B
                                  </th>
                                  <th className="p-2 border text-sm font-medium bg-yellow-200">
                                    A+B Kg
                                  </th>
                                  <th className="p-2 border text-sm font-medium bg-yellow-50">
                                    A+B %
                                  </th>
                                  <th className="p-2 border text-sm font-medium">
                                    A %
                                  </th>
                                  <th className="p-2 border text-sm font-medium">
                                    B %
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {batch.items.map((item, itemIndex) => (
                                  <tr key={itemIndex} className="text-center">
                                    <td className="p-2 border text-sm bg-red-100">{item.screwA} KG</td>
                                    <td className="p-2 border text-sm font-medium bg-yellow-50">{item.material}</td>
                                    <td className="p-2 border text-sm bg-orange-100">{item.screwB} KG</td>
                                    <td className="p-2 border text-sm bg-yellow-50">{item.total} KG</td>
                                    <td className="p-2 border text-sm">{item.percentage}%</td>
                                    <td className="p-2 border text-sm">{item.screwAPercentage}%</td>
                                    <td className="p-2 border text-sm">{item.screwBPercentage}%</td>
                                  </tr>
                                ))}
                                {/* Batch total row */}
                                <tr className="bg-gray-200 text-center">
                                  <td className="p-2 border text-sm font-bold">
                                    {batch.totals.screwA} KG
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    {t('common.total')}
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    {batch.totals.screwB} KG
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    {batch.totals.total} KG
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    100%
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    30%
                                  </td>
                                  <td className="p-2 border text-sm font-bold">
                                    70%
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function AbaPrintTemplate({ data }: { data: AbaCalculationResult }) {
  if (!data) return null;

  return (
    <div className="print-template p-4 max-w-[750px] bg-white">
      <div className="bg-yellow-100 p-2 mb-4">
        <h1 className="text-xl font-bold text-center">Test ABA</h1>
        <h2 className="text-lg font-bold text-center">
          {data.batches && data.batches.length > 1 
            ? `ABA Formula - Summary (${data.rawMaterial})`
            : `ABA Formula ${data.rawMaterial}`}
        </h2>
      </div>
      
      <div className="flex justify-between mb-4">
        <div className="text-sm">
          <span className="font-bold">{data.mixId}</span>
        </div>
        <div className="text-sm">
          <span>{data.mixDate}</span>
        </div>
        <div className="text-sm">
          <span className="font-bold">Qty</span> {data.quantity} kg
        </div>
      </div>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <th className="p-2 border bg-red-200 text-center">Screw A</th>
            <th className="p-2 border bg-yellow-100 text-center">Raw Materials</th>
            <th className="p-2 border bg-orange-200 text-center">Screw B</th>
            <th className="p-2 border bg-yellow-200 text-center">A+B Kg</th>
            <th className="p-2 border bg-yellow-50 text-center">A+B %</th>
            <th className="p-2 border text-center">A %</th>
            <th className="p-2 border text-center">B %</th>
            <th className="p-2 border text-center text-orange-500">A %</th>
            <th className="p-2 border text-center text-teal-500">B %</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="p-2 border bg-red-100 text-center">{item.screwA} KG</td>
              <td className="p-2 border bg-yellow-50 text-center font-medium">{item.material}</td>
              <td className="p-2 border bg-orange-100 text-center">{item.screwB} KG</td>
              <td className="p-2 border bg-yellow-50 text-center">{item.total} KG</td>
              <td className="p-2 border text-center">{item.percentage}%</td>
              <td className="p-2 border text-center">{item.screwAPercentage}%</td>
              <td className="p-2 border text-center">{item.screwBPercentage}%</td>
              <td className="p-2 border text-center text-orange-500">{item.screwAAbsPercentage}%</td>
              <td className="p-2 border text-center text-teal-500">{item.screwBAbsPercentage}%</td>
            </tr>
          ))}
          <tr className="bg-gray-200">
            <td className="p-2 border text-center font-bold">{data.totals.screwA} KG</td>
            <td className="p-2 border text-center font-bold">Total</td>
            <td className="p-2 border text-center font-bold">{data.totals.screwB} KG</td>
            <td className="p-2 border text-center font-bold">{data.totals.total} KG</td>
            <td className="p-2 border text-center font-bold">100%</td>
            <td className="p-2 border text-center font-bold">{data.totals.screwAPercentage}%</td>
            <td className="p-2 border text-center font-bold">{data.totals.screwBPercentage}%</td>
            <td className="p-2 border text-center font-bold text-orange-500">{data.totals.screwAAbsPercentage}%</td>
            <td className="p-2 border text-center font-bold text-teal-500">{data.totals.screwBAbsPercentage}%</td>
          </tr>
        </tbody>
      </table>
      
      {/* Display batch information if quantity > 900kg */}
      {data.batches && data.batches.length > 1 && (
        <div>
          <p className="mt-4 mb-2 text-sm italic text-gray-700 border-t pt-2">
            Note: This quantity exceeds the maximum 900kg per mixing formula. The calculation has been divided into the following batches:
          </p>
          
          {data.batches.map((batch, batchIndex) => (
            <div key={batchIndex} className="mb-6">
              <h3 className="text-md font-medium mb-2">Batch {batch.batchNumber} - {batch.quantity} kg</h3>
              
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="p-2 border bg-red-200 text-center">Screw A</th>
                    <th className="p-2 border bg-yellow-100 text-center">Raw Materials</th>
                    <th className="p-2 border bg-orange-200 text-center">Screw B</th>
                    <th className="p-2 border bg-yellow-200 text-center">A+B Kg</th>
                    <th className="p-2 border bg-yellow-50 text-center">A+B %</th>
                    <th className="p-2 border text-center">A %</th>
                    <th className="p-2 border text-center">B %</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.items.map((item, itemIndex) => (
                    <tr key={itemIndex}>
                      <td className="p-2 border bg-red-100 text-center">{item.screwA} KG</td>
                      <td className="p-2 border bg-yellow-50 text-center font-medium">{item.material}</td>
                      <td className="p-2 border bg-orange-100 text-center">{item.screwB} KG</td>
                      <td className="p-2 border bg-yellow-50 text-center">{item.total} KG</td>
                      <td className="p-2 border text-center">{item.percentage}%</td>
                      <td className="p-2 border text-center">{item.screwAPercentage}%</td>
                      <td className="p-2 border text-center">{item.screwBPercentage}%</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200">
                    <td className="p-2 border text-center font-bold">{batch.totals.screwA} KG</td>
                    <td className="p-2 border text-center font-bold">Total</td>
                    <td className="p-2 border text-center font-bold">{batch.totals.screwB} KG</td>
                    <td className="p-2 border text-center font-bold">{batch.totals.total} KG</td>
                    <td className="p-2 border text-center font-bold">100%</td>
                    <td className="p-2 border text-center font-bold">30%</td>
                    <td className="p-2 border text-center font-bold">70%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-8 text-center">
        {new Date().toLocaleString()}
      </div>
    </div>
  );
}