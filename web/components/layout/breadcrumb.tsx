import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight size={12} aria-hidden /> : null}
            {item.href ? (
              <Link href={item.href} className="rounded hover:text-lime-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-neutral-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
