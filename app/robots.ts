import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seen-platform.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/merchant/', '/login', '/login-admin'],
      },
      {
        // Block known AI bots and scrapers
        userAgent: [
          'Amazonbot', 
          'Applebot-Extended', 
          'Bytespider', 
          'CCBot', 
          'ClaudeBot', 
          'CloudflareBrowserRenderingCrawler', 
          'Google-Extended', 
          'GPTBot', 
          'meta-externalagent', 
          'ChatGPT-User', 
          'OAI-SearchBot', 
          'Claude-Web'
        ],
        disallow: ['/'],
      },
    ],
  };
}
