import nextPWA from 'next-pwa';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: 'placehold.co',
      },
      {
        protocol: "https" as const,
        hostname: 'sjiazaffsxoxeqsw.public.blob.vercel-storage.com',
      },
    ],
  },
};

const withPWA = nextPWA({
  dest: 'public'
});

export default withPWA({ ...nextConfig });