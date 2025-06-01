import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { LucideIcon } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "destructive" | string;
  className?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  columns?: number;
}

export function QuickActions({ title, actions, columns = 2 }: QuickActionsProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const gridCols = columns === 3 ? "grid-cols-3" : columns === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <Card className="p-4 mb-4">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      )}
      <div className={`grid ${gridCols} gap-3`}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant === "default" ? "default" : action.variant === "destructive" ? "destructive" : action.variant === "secondary" ? "secondary" : "outline"}
              size="sm"
              onClick={action.onClick}
              className={`h-16 flex-col space-y-1 text-xs ${action.className || ""}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-center leading-tight">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}