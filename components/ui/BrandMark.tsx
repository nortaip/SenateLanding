/** The Senate pinwheel mark, in the brand's own colours. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/senate-icon.png"
      alt=""
      aria-hidden
      width={40}
      height={40}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
