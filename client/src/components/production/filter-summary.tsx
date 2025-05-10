import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface FilterSummaryProps {
  filterMode: 'all' | 'date' | 'week' | 'month';
  filterDate: Date | null;
  filterWeek: string | null;
  filterMonth: string | null;
  onClear: () => void;
  isMobile: boolean;
}

export function FilterSummary({ 
  filterMode, 
  filterDate, 
  filterWeek, 
  filterMonth, 
  onClear, 
  isMobile 
}: FilterSummaryProps) {
  if (filterMode === 'all') return null;
  
  return (
    <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md flex justify-between items-center">
      <div className="flex items-center overflow-hidden">
        <span className="material-icons text-sm mr-2 shrink-0">filter_list</span>
        <span className={`text-sm font-medium ${isMobile ? 'truncate max-w-[180px]' : ''}`}>
          {filterMode === 'date' && filterDate && 
            `Showing mixes for: ${format(new Date(filterDate), isMobile ? 'MMM d, yyyy' : 'MMMM d, yyyy')}`}
          {filterMode === 'week' && filterWeek && 
            `Showing mixes for week: ${filterWeek.replace('-W', isMobile ? ', W' : ', Week ')}`}
          {filterMode === 'month' && filterMonth && 
            `Showing mixes for: ${format(new Date(`${filterMonth}-01`), isMobile ? 'MMM yyyy' : 'MMMM yyyy')}`}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClear}
        className={`${isMobile ? 'h-7 w-7 p-0' : 'h-7'} text-blue-700 hover:bg-blue-100 shrink-0`}
      >
        <span className="material-icons text-sm">{isMobile ? 'clear' : ''}</span>
        {!isMobile && <span className="ml-1">Clear</span>}
      </Button>
    </div>
  );
}