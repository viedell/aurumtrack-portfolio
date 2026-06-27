import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

export function Icon({ name, className, filled, size }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined select-none leading-none", filled && "ms-fill", className)}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
