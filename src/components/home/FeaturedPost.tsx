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

export default function FeaturedPost({ post }: Props) {
  const prefersReduced = useReducedMotion();

  const motionProps = prefersReduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' as const },
      };

  const tags = post.tags.slice(0, 3);

  return (
    <motion.a
      href={`/posts/${post.slug}/`}
      {...motionProps}
      className="group flex flex-col gap-6 rounded-[20px] bg-[#101010] p-7"
    >
      <div className="relative aspect-[4/2] overflow-hidden rounded-2xl">
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
                'linear-gradient(135deg, color-mix(in oklch, var(--color-accent) 35%, transparent) 0%, color-mix(in oklch, var(--color-accent-2) 20%, transparent) 55%, color-mix(in oklch, var(--color-line) 70%, transparent) 100%)',
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
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
          className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
          dir="auto"
        >
          {post.title}
        </h3>
        <p
          className="text-base leading-relaxed text-[var(--color-muted)]"
          dir="auto"
        >
          {post.description}
        </p>
      </div>
    </motion.a>
  );
}
