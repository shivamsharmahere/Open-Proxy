import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-7 w-7", className)}
      aria-hidden="true"
    >
      <rect
        width="64"
        height="64"
        rx="15"
        fill="oklch(0.216 0.008 90)"
      />
      <g fill="none" strokeWidth="4.5" strokeLinecap="round">
        <path d="M12 20h10" stroke="oklch(0.6 0.14 155)" />
        <path d="M12 32h10" stroke="oklch(0.6 0.14 155)" />
        <path d="M12 44h10" stroke="oklch(0.6 0.14 155)" />
        <path
          d="M22 20c10 0 8 12 18 12"
          stroke="oklch(0.7 0.13 155)"
        />
        <path d="M22 32h18" stroke="oklch(0.7 0.13 155)" />
        <path
          d="M22 44c10 0 8-12 18-12"
          stroke="oklch(0.7 0.13 155)"
        />
        <path
          d="M40 32h12"
          stroke="oklch(0.86 0.1 155)"
          strokeWidth="5.5"
        />
      </g>
      <circle cx="40" cy="32" r="4.5" fill="oklch(0.6 0.14 155)" />
    </svg>
  );
}
