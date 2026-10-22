import type { ReactNode } from "react";

type SpeechBubbleProps = {
  children: ReactNode;
  className?: string;
};

// Elips dan ekor digambar dalam satu path supaya garis tepinya menyambung.
// viewBox diregangkan mengikuti isi; vector-effect menjaga garis tetap 2px.
const BUBBLE_PATH =
  "M 41.67 53.6 A 48 26 0 1 0 26 50.5 L 16 59.5 L 41.67 53.6 Z";

export function SpeechBubble({ children, className = "" }: SpeechBubbleProps) {
  return (
    <div
      className={`relative flex items-center justify-center px-[14%] pt-[10%] pb-[12%] text-center ${className}`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
      >
        <path
          d={BUBBLE_PATH}
          fill="var(--color-white)"
          stroke="var(--color-ink)"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative min-w-0">{children}</div>
    </div>
  );
}
