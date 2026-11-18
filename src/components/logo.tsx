/** The What Stuck mark: an opening quotation mark, because the product is people's own words. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <rect width="64" height="64" rx="14" fill="#9a3412" />
      <path
        d="M27 20c-6 2-11 8-11 16v9h12V33h-6c0-5 3-8 7-9l-2-4Zm19 0c-6 2-11 8-11 16v9h12V33h-6c0-5 3-8 7-9l-2-4Z"
        fill="#faf7f2"
      />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-serif text-xl leading-none font-medium tracking-[-0.01em]">
        What Stuck
      </span>
    </span>
  );
}
