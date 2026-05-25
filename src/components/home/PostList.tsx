import { useEffect, useState } from 'react';
import FeaturedPostCard from './FeaturedPostCard';
import PostListItem from './PostListItem';

export interface PostImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  pubDate: Date | string;
  tags: string[];
  image: PostImage | null;
}

export interface PostStat {
  claps: number;
  comments: number;
}

interface Props {
  posts: Post[];
}

export default function PostList({ posts }: Props) {
  const [stats, setStats] = useState<Record<string, PostStat>>({});

  useEffect(() => {
    if (posts.length === 0) return;
    let cancelled = false;
    const slugs = posts.map((p) => p.slug).join(',');
    fetch(`/api/stats?slugs=${encodeURIComponent(slugs)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stats?: Record<string, PostStat> } | null) => {
        if (cancelled || !data?.stats) return;
        setStats(data.stats);
      })
      .catch(() => {
        // Counts simply won't appear on previews — graceful degrade.
      });
    return () => {
      cancelled = true;
    };
  }, [posts]);

  if (posts.length === 0) return null;

  const [featured, ...rest] = posts;

  return (
    <div className="space-y-10">
      <FeaturedPostCard post={featured} stat={stats[featured.slug]} />
      {rest.length > 0 && (
        <ul className="space-y-1">
          {rest.map((post, i) => (
            <PostListItem
              key={post.slug}
              post={post}
              index={i}
              stat={stats[post.slug]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
