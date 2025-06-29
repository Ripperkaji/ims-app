
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  iconClassName?: string;
  href?: string;
  isCurrency?: boolean;
}

export default function AnalyticsCard({
  title,
  value,
  icon: Icon,
  description,
  iconClassName,
  href,
  isCurrency = true, // Default to true, explicitly set to false for counts
}: AnalyticsCardProps) {
  let displayValue: string;

  if (typeof value === 'number') {
    if (isCurrency) {
      displayValue = `NRP ${formatCurrency(value)}`;
    } else {
      displayValue = value.toString();
    }
  } else {
    displayValue = value;
  }

  const cardInnerContent = (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-5 w-5 text-primary", iconClassName)} />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-3xl font-bold font-headline">{displayValue}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardInnerContent}
      </Link>
    );
  }

  return cardInnerContent;
}
