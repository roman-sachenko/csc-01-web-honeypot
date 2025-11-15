/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Use Docker service name when running in Docker, localhost otherwise
    const apiHost = process.env.API_HOST || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

