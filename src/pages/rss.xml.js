import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site.ts';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: SITE.name,
    description: SITE.defaultDescription,
    site: context.site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>he-IL</language><atom:link href="${new URL('/rss.xml', context.site).href}" rel="self" type="application/rss+xml" />`,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
      author: SITE.author.name,
    })),
  });
}
