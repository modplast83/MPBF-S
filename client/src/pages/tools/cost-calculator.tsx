import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/page-header";
import CostCalculator from "@/components/production/cost-calculator";

export default function CostCalculatorPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <PageHeader
        title={t('cost_calculator.title')}
        description={t('cost_calculator.title')}
        icon="calculate"
      />
      
      <CostCalculator />
    </div>
  );
}