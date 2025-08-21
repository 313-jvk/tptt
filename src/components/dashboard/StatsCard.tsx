import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default'
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover-lift group glass",
      variant === 'success' && "border-secondary/30 bg-gradient-secondary/10",
      variant === 'warning' && "border-warning/30 bg-gradient-warning/10",
      variant === 'default' && "border-primary/20 hover:border-primary/40"
    )}>
      <CardContent className="p-6 relative">
        {/* Background glow effect */}
        <div className={cn(
          "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
          variant === 'success' && "bg-secondary",
          variant === 'warning' && "bg-warning",
          variant === 'default' && "bg-primary"
        )}></div>
        
        <div className="flex items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </CardTitle>
          <div className="relative">
            <Icon className={cn(
              "h-5 w-5 transition-all duration-300 group-hover:scale-110",
              variant === 'success' && "text-secondary group-hover:text-secondary-glow",
              variant === 'warning' && "text-warning group-hover:text-warning",
              variant === 'default' && "text-primary group-hover:text-primary-glow"
            )} />
            <div className={cn(
              "absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300",
              variant === 'success' && "bg-secondary",
              variant === 'warning' && "bg-warning",
              variant === 'default' && "bg-primary"
            )}></div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:bg-gradient-hero transition-all duration-300">
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
                trend.positive 
                  ? "bg-secondary/10 text-secondary border border-secondary/20" 
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}>
                <span>
                  {trend.positive ? "↗" : "↘"} {trend.value}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};