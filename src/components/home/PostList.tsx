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

interface Props {
  posts: Post[];
}

export default function PostList({ posts }: Props) {
  if (posts.length === 0) return null;

  const [featured, ...rest] = posts;

  return (
    <div className="space-y-10">
      <FeaturedPostCard post={featured} />
      {rest.length > 0 && (
        <ul className="space-y-1">
          {rest.map((post, i) => (
            <PostListItem key={post.slug} post={post} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
