import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { canonicalBase, metadataForPath } from '../seo';

export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = metadataForPath(pathname);
    document.title = metadata.title;

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = metadata.description;

    const canonicalUrl = `${canonicalBase}${metadata.path}`;
    const openGraph = [
      ['og:title', metadata.title],
      ['og:description', metadata.description],
      ['og:url', canonicalUrl]
    ];
    for (const [property, content] of openGraph) {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.append(tag);
      }
      tag.content = content;
    }

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = metadata.path === '/account/' || metadata.path === '/admin/' ? 'noindex, nofollow' : 'index, follow';

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;

    let structuredData = document.querySelector<HTMLScriptElement>('#recoverx-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'recoverx-structured-data';
      structuredData.type = 'application/ld+json';
      document.head.append(structuredData);
    }
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'RecoverX',
      url: canonicalBase,
      description: metadata.description,
      publisher: {
        '@type': 'Organization',
        name: 'RecoverX',
        url: canonicalBase
      }
    });
  }, [pathname]);

  return null;
}
