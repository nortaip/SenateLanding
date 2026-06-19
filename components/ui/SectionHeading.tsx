import { Reveal } from "./Reveal";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: Props) {
  const isCenter = align === "center";
  return (
    <div
      className={`${isCenter ? "mx-auto text-center" : "text-left"} max-w-3xl ${className}`}
    >
      {eyebrow && (
        <Reveal>
          <span className="glass-gold inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold-300">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={1}>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-mist-100 sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={2}>
          <p
            className={`mt-5 text-base leading-relaxed text-mist-300 sm:text-lg ${
              isCenter ? "mx-auto max-w-2xl" : ""
            }`}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}
