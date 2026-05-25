import { motion, useReducedMotion } from 'motion/react';
import type { Post } from './PostList';

const formatDate = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const isoDate = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString();
};

interface Props {
  post: Post;
  index: number;
}

export default function PostListItem({ post, index }: Props) {
  const prefersReduced = useReducedMotion();

  const motionProps = prefersReduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.35,
          delay: 0.15 + index * 0.06,
          ease: 'easeOut' as const,
        },
      };

  return (
    <motion.li {...motionProps}>
      <a
        href={`/posts/${post.slug}/`}
        className="group flex items-center gap-4 border-b border-[var(--color-line)] py-4 transition hover:border-[var(--color-accent)] sm:gap-5 sm:py-5"
      >
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-[var(--color-line)] sm:h-24 sm:w-36">
          {post.image ? (
            <img
              src={post.image.src}
              alt={post.image.alt}
              width={post.image.width}
              height={post.image.height}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in oklch, var(--color-accent) 30%, transparent) 0%, color-mix(in oklch, var(--color-accent-2) 18%, transparent) 60%, color-mix(in oklch, var(--color-line) 70%, transparent) 100%)',
              }}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
            <time dateTime={isoDate(post.pubDate)}>{formatDate(post.pubDate)}</time>
            {post.tags.length > 0 && (
              <ul className="flex flex-wrap gap-1" dir="auto">
                {post.tags.slice(0, 3).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-[color-mix(in_oklch,var(--color-line)_70%,transparent)] px-2 py-0.5"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span
            className="font-semibold tracking-tight transition group-hover:text-[var(--color-accent)]"
            dir="auto"
          >
            {post.title}
          </span>
          <span
            className="line-clamp-2 text-sm text-[var(--color-muted)]"
            dir="auto"
          >
            {post.description}
          </span>
        </div>
      </a>
    </motion.li>
  );
}
