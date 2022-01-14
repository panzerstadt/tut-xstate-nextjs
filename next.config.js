/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['preview.redd.it', 'external-preview.redd.it', 'b.thumbs.redditmedia.com', 'a.thumbs.redditmedia.com']
  }
}

module.exports = nextConfig
