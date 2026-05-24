import type { ReactNode } from 'react';

interface Props {
  title?: string;
  caption?: string;
  children: ReactNode;
}

export default function DemoFrame({ title, caption, children }: Props) {
  return (
    <figure className="demo-frame not-prose my-8">
      {title && (
        <figcaption className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          {title}
        </figcaption>
      )}
      <div>{children}</div>
      {caption && (
        <p className="mt-3 text-sm italic text-[var(--color-muted)]">{caption}</p>
      )}
    </figure>
  );
}
