import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Grid3X3 } from 'lucide-react';
import { RoleBasedDashboard } from "@/components/dashboard/role-based-dashboard";
import { CustomizableDashboardV2 } from "@/components/dashboard/customizable-dashboard-v2";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'standard' | 'customizable'>('customizable');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('standard')}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Standard
          </Button>
          <Button
            variant={viewMode === 'customizable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('customizable')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Customizable
          </Button>
        </div>
      </div>

      {viewMode === 'customizable' ? (
        <CustomizableDashboardV2 />
      ) : (
        <RoleBasedDashboard />
      )}
    </div>
  );
}
