import FeaturedPost from './FeaturedPost';
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
  subheading?: string;
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
    <div>
      <FeaturedPost post={featured} />
      {rest.length > 0 && (
        <ul className="mt-16 grid grid-cols-1 gap-x-9 gap-y-14 md:grid-cols-2">
          {rest.map((post, i) => (
            <PostListItem key={post.slug} post={post} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
