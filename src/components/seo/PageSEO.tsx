
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { getContentBySlug, WPPage, YoastHeadJson } from '@/services/wordpress';
import { cleanCanonicalUrl } from '@/utils/seoUtils';
import { useLocation, useNavigate } from 'react-router-dom';

const SITE_NAME = 'Paradise Roofers';

interface PageSEOProps {
    slug?: string;
    title?: string;
    description?: string;
    canonicalUrl?: string;
}

const PageSEO = ({ slug, title, description, canonicalUrl: customCanonical }: PageSEOProps) => {
    const location = useLocation();

    // If static SEO data is provided, use it directly (skip WordPress query)
    if (title || description) {
        const urlToUse = customCanonical || `https://paradiseroofers.com${location.pathname}`;
        const fullTitle = title ? (title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`) : SITE_NAME;
        
        return (
            <Helmet>
                <title>{fullTitle}</title>
                {description && <meta name="description" content={description} />}
                <link rel="canonical" href={cleanCanonicalUrl(urlToUse)} />
                <meta property="og:title" content={fullTitle} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:url" content={cleanCanonicalUrl(urlToUse)} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={fullTitle} />
                {description && <meta name="twitter:description" content={description} />}
            </Helmet>
        );
    }

    const { data: page, isLoading, isError } = useQuery<WPPage | null>({
        queryKey: ['wordpress-page', slug],
        queryFn: () => slug ? getContentBySlug(slug) : Promise.resolve(null),
        enabled: !!slug,
        staleTime: 600000,
    });

    const navigate = useNavigate();

    useEffect(() => {
        // Add trailing slash handling if needed, though redirect handler will generally handle it
    }, [location.pathname]);

    if (!slug) return <Helmet><title>{SITE_NAME}</title></Helmet>;
    if (isLoading) return <Helmet><title>{SITE_NAME}</title></Helmet>;
    if (isError || !page) return <Helmet><title>{SITE_NAME}</title></Helmet>;

    const yoast = page.yoast_head_json;

    if (!yoast) {
        // Fallback if no Yoast data
        return (
            <Helmet>
                <title>{page.title.rendered} - {SITE_NAME}</title>
                <meta name="description" content={page.excerpt.rendered.replace(/<[^>]+>/g, '')} />
                <link rel="canonical" href={cleanCanonicalUrl(window.location.href)} />
            </Helmet>
        );
    }

    const canonicalUrl = cleanCanonicalUrl(yoast.canonical);

    return (
        <Helmet>
            {/* Title */}
            <title>{yoast.title}</title>

            {/* Meta Tags */}
            <meta name="description" content={yoast.description} />
            <meta name="robots" content={`${yoast.robots.index}, ${yoast.robots.follow}`} />

            {/* Canonical */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:locale" content={yoast.og_locale} />
            <meta property="og:type" content={yoast.og_type} />
            <meta property="og:title" content={yoast.og_title} />
            <meta property="og:description" content={yoast.og_description} />
            <meta property="og:url" content={cleanCanonicalUrl(yoast.og_url)} />
            <meta property="og:site_name" content={yoast.og_site_name} />
            {yoast.og_image && yoast.og_image.map((img, index) => (
                <meta key={index} property="og:image" content={img.url} />
            ))}

            {/* Twitter */}
            <meta name="twitter:card" content={yoast.twitter_card} />
            {yoast.twitter_site && <meta name="twitter:site" content={yoast.twitter_site} />}

            {/* Schema */}
            {yoast.schema && (
                <script type="application/ld+json">
                    {JSON.stringify(yoast.schema)}
                </script>
            )}
        </Helmet>
    );
};

export default PageSEO;
