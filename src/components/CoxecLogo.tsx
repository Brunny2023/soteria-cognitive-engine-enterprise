type CoxecLogoProps = {
  compact?: boolean;
  className?: string;
};

export function CoxecMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="6"
        fill="currentColor"
        className="text-surface"
      />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="6"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="2"
      />
      <path
        d="M27 12H20.5C14.7 12 10 16.7 10 22.5v3C10 31.3 14.7 36 20.5 36H27"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="4"
        strokeLinecap="square"
      />
      <path
        d="M27 12 38 36M38 12 27 36"
        stroke="currentColor"
        className="text-foreground"
        strokeWidth="4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function CoxecLogo({ compact = false, className = "" }: CoxecLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`.trim()} aria-label="Coxec">
      <CoxecMark className={compact ? "size-8" : "size-9"} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-semibold uppercase text-foreground">Coxec</span>
          <span className="mt-1 font-mono text-[8px] uppercase text-muted-foreground">
            Executive cognition
          </span>
        </span>
      )}
    </span>
  );
}
