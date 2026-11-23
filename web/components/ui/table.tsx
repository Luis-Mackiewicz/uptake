import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TablePartProps {
  className?: string;
  children?: ReactNode;
}

type TableRowProps = ComponentPropsWithoutRef<"tr">;

export function Table({ className, children }: TablePartProps) {
  return <div className={cn("overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-panel", className)}><table className="w-full text-left text-sm">{children}</table></div>;
}

export function TableHeader({ className, children }: TablePartProps) {
  return <thead className={cn("border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500", className)}>{children}</thead>;
}

export function TableBody({ className, children }: TablePartProps) {
  return <tbody className={cn("divide-y divide-neutral-200", className)}>{children}</tbody>;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, children, ...props }, ref) {
    return (
      <tr
        {...props}
        ref={ref}
        className={cn("transition hover:bg-neutral-50", className)}
      >
        {children}
      </tr>
    );
  },
);

export function TableHead({ className, children }: TablePartProps) {
  return <th scope="col" className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TableCell({ className, children }: TablePartProps) {
  return <td className={cn("px-4 py-3 align-middle text-neutral-800", className)}>{children}</td>;
}
