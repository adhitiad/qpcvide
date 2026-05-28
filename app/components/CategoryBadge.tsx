import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface CategoryBadgeProps {
  category: {
    name: string;
    type: string;
  };
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  let badgeClass = "bg-night-hover text-night-text border-transparent";
  
  switch (category.type) {
    case "region":
      badgeClass = "bg-red-500/10 text-red-500 border-red-500/20";
      break;
    case "genre":
      badgeClass = "bg-purple-500/10 text-purple-500 border-purple-500/20";
      break;
    case "format":
      badgeClass = "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      break;
  }

  return (
    <Badge variant="outline" className={cn("text-[10px] sm:text-xs font-medium uppercase", badgeClass, className)}>
      {category.name}
    </Badge>
  );
}
