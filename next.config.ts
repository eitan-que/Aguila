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
      {
        protocol: "https" as const,
        hostname: 'lh3.googleusercontent.com', // Google profile pictures
      },
    ],
  },
};

const withPWA = nextPWA({
  dest: 'public'
});

export default withPWA({ ...nextConfig });