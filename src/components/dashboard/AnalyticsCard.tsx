
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string; 
  trendDirection?: 'up' | 'down';
}

export default function AnalyticsCard({ title, value, icon: Icon, description, trend, trendDirection }: AnalyticsCardProps) {
  let displayValue: string;

  if (typeof value === 'number') {
    // Titles for counts that should not have currency prefix
    const countTitles = ["due payments", "total products", "low stock items"];
    if (countTitles.includes(title.toLowerCase())) {
      displayValue = value.toString();
    } else {
      displayValue = `NRP ${value.toFixed(2)}`;
    }
  } else {
    displayValue = value;
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{displayValue}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        {trend && (
          <p className={`text-xs pt-1 ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
