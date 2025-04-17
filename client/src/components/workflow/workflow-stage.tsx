import { useQuery } from "@tanstack/react-query";
import { RollCard } from "@/components/workflow/roll-card";
import { API_ENDPOINTS } from "@/lib/constants";
import { Roll } from "@shared/schema";

interface WorkflowStageProps {
  title: string;
  icon: string;
  stage: string;
  iconColor: string;
  iconBgColor: string;
}

export function WorkflowStage({ 
  title, 
  icon, 
  stage, 
  iconColor, 
  iconBgColor 
}: WorkflowStageProps) {
  // Fetch rolls by stage
  const { data: rolls, isLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/${stage}`],
  });
  
  return (
    <div className="bg-secondary-50 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <div className={`rounded-full ${iconBgColor} p-2 mr-3`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-secondary-500">
            {isLoading 
              ? "Loading..." 
              : `${rolls?.length || 0} rolls in progress`}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          <>
            <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
            <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
          </>
        ) : rolls && rolls.length > 0 ? (
          rolls.map((roll) => (
            <RollCard key={roll.id} roll={roll} />
          ))
        ) : (
          <div className="py-8 text-center text-secondary-400">
            <span className="material-icons text-3xl mb-2">hourglass_empty</span>
            <p>No rolls in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}
