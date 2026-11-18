import { OliveBranch } from "./landing/ornaments";

/**
 * A short passage set in the page. Text is quoted exactly from the Berean
 * Standard Bible (public domain), always with its reference.
 */
export function Verse({
  text,
  reference,
  className = "",
}: {
  text: string;
  reference: string;
  className?: string;
}) {
  return (
    <figure className={`relative flex gap-3 ${className}`}>
      <OliveBranch className="text-gold/70 mt-1 w-10 shrink-0" />
      <div>
        <blockquote className="text-ink font-serif text-lg leading-snug">
          &ldquo;{text}&rdquo;
        </blockquote>
        <figcaption className="text-ink-subtle mt-1 text-sm">
          {reference}, Berean Standard Bible
        </figcaption>
      </div>
    </figure>
  );
}

export const VERSES = {
  lamp: {
    text: "Your word is a lamp to my feet and a light to my path.",
    reference: "Psalm 119:105",
  },
  notEmpty: {
    text: "so My word that proceeds from My mouth will not return to Me empty, but it will accomplish what I please, and it will prosper where I send it.",
    reference: "Isaiah 55:11",
  },
  dwell: {
    text: "Let the word of Christ richly dwell within you as you teach and admonish one another with all wisdom, and as you sing psalms, hymns, and spiritual songs with gratitude in your hearts to God.",
    reference: "Colossians 3:16",
  },
} as const;
