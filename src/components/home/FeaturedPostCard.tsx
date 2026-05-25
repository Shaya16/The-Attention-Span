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
}

export default function FeaturedPostCard({ post }: Props) {
  const prefersReduced = useReducedMotion();

  const motionProps = prefersReduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' as const },
      };

  return (
    <motion.a
      href={`/posts/${post.slug}/`}
      {...motionProps}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--color-line)] transition hover:border-[var(--color-accent)] sm:aspect-video"
    >
      {post.image ? (
        <img
          src={post.image.src}
          alt={post.image.alt}
          width={post.image.width}
          height={post.image.height}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklch, var(--color-accent) 35%, transparent) 0%, color-mix(in oklch, var(--color-accent-2) 20%, transparent) 55%, color-mix(in oklch, var(--color-line) 70%, transparent) 100%)',
          }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
          <time dateTime={isoDate(post.pubDate)}>{formatDate(post.pubDate)}</time>
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" dir="auto">
              {post.tags.slice(0, 3).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-white/85 backdrop-blur-sm"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>
        <h3
          className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
          dir="auto"
        >
          {post.title}
        </h3>
        <p
          className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base"
          dir="auto"
        >
          {post.description}
        </p>
      </div>
    </motion.a>
  );
}
