import { motion, useReducedMotion } from 'motion/react';

interface Post {
  slug: string;
  title: string;
  description: string;
  pubDate: Date | string;
}

interface Props {
  posts: Post[];
}

export default function PostList({ posts }: Props) {
  const prefersReduced = useReducedMotion();

  const formatDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const isoDate = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString();
  };

  return (
    <ul className="space-y-1">
      {posts.map((post, i) => {
        const itemProps = prefersReduced
          ? { initial: false as const, animate: { opacity: 1, y: 0 } }
          : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' as const },
            };

        return (
          <motion.li key={post.slug} {...itemProps}>
            <a
              href={`/posts/${post.slug}/`}
              className="group flex items-baseline gap-4 border-b border-[var(--color-line)] py-5 transition hover:border-[var(--color-accent)]"
            >
              <time
                dateTime={isoDate(post.pubDate)}
                className="shrink-0 font-mono text-xs text-[var(--color-muted)]"
              >
                {formatDate(post.pubDate)}
              </time>
              <span className="flex-1" dir="auto">
                <span className="font-medium transition group-hover:text-[var(--color-accent)]">
                  {post.title}
                </span>
                <span className="ml-2 text-sm text-[var(--color-muted)]">
                  {post.description}
                </span>
              </span>
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
