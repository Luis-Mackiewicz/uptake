import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  className?: string;
  children?: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return <section className={cn("rounded-xl border border-neutral-200 bg-white p-6 shadow-panel", className)}>{children}</section>;
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("mb-4 space-y-1", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h2 className={cn("font-display text-2xl tracking-wide text-neutral-900", className)}>{children}</h2>;
}

export function CardDescription({ className, children }: CardProps) {
  return <p className={cn("text-sm text-neutral-600", className)}>{children}</p>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export default Card;
