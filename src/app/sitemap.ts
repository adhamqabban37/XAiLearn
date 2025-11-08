import { MetadataRoute } from 'next'

/**
 * Dynamic sitemap for AI-Learn Platform
 * Helps AI agents and search engines discover all important pages
 * Next.js will automatically generate sitemap.xml at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
  const currentDate = new Date()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
      // Homepage - highest priority for AI agents
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      // Main user dashboard
    },
    {
      url: `${baseUrl}/lesson`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
      // Core learning experience
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      // About page - important for AI understanding
    },
    {
      url: `${baseUrl}/ai-info`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      // Dedicated AI agent information page
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
      // FAQ page - helps AI agents answer user questions
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add more dynamic routes here as your platform grows
    // Example: Individual course pages, blog posts, etc.
  ]
}
