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
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay: 0.2 + index * 0.07,
          ease: 'easeOut' as const,
        },
      };

  const tags = post.tags.slice(0, 3);

  return (
    <motion.li {...motionProps}>
      <a href={`/posts/${post.slug}/`} className="group block">
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          {post.image ? (
            <img
              src={post.image.src}
              alt={post.image.alt}
              width={post.image.width}
              height={post.image.height}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs" dir="auto">
            <time
              dateTime={isoDate(post.pubDate)}
              className="text-[var(--color-muted)]"
            >
              {formatDate(post.pubDate)}
            </time>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-white/80"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <h3
            className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl"
            dir="auto"
          >
            {post.title}
          </h3>
          <p
            className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]"
            dir="auto"
          >
            {post.description}
          </p>
        </div>
      </a>
    </motion.li>
  );
}
