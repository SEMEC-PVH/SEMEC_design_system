import createMDX from '@next/mdx'

const basePath = process.env.NODE_ENV === 'production' ? '/SEMEC_design_system' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  allowedDevOrigins: ['10.102.3.109'],
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  transpilePackages: ['semec-ds'],
  images: { unoptimized: true },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap' }],
      ['rehype-pretty-code', { theme: { light: 'github-light', dark: 'github-dark' }, keepBackground: false }],
    ],
  },
})

export default withMDX(nextConfig);
