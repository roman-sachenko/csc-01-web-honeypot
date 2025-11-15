/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js will use the 'app' directory at project root
  async rewrites() {
    // Use API_HOST from env, or construct from PORT env var, or default to localhost:3000
    const apiPort = process.env.PORT || '3000';
    const apiHost = process.env.API_HOST || `http://localhost:${apiPort}`;
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost}/api/:path*`,
      },
      // Route well-known and static files to backend
      {
        source: '/.well-known/:path*',
        destination: `${apiHost}/.well-known/:path*`,
      },
      {
        source: '/robots.txt',
        destination: `${apiHost}/robots.txt`,
      },
      {
        source: '/sitemap.xml',
        destination: `${apiHost}/sitemap.xml`,
      },
      {
        source: '/.env',
        destination: `${apiHost}/.env`,
      },
    ];
  },
};

export default nextConfig;
