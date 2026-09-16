import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/SEMEC_design_system',
  trailingSlash: true,
  allowedDevOrigins: ['10.102.3.109'],
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  transpilePackages: ['@semec/ds-react'],
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
