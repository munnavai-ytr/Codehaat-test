export interface BrandConfig {
  name: string;
  tagline: string;
  taglineBn: string;
  description: string;
  supportEmail: string;
  colors: {
    indigo: string;
    warmCream: string;
    coral: string;
    coralHover: string;
    mint: string;
    lilac: string;
    darkCanvas: string;
    darkCard: string;
  };
  socials: {
    github: string;
    x: string;
    discord: string;
  };
}

export const brandConfig: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'CodeHaat',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Preview. Talk. Deal.',
  taglineBn: 'কোডের হাট',
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
    'The free, software-only marketplace where anyone can sell and discover apps, websites, templates and source-code projects with instant live preview and direct chat.',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  colors: {
    indigo: '#1E1B4B',
    warmCream: '#FAF7F2',
    coral: '#FF6B57',
    coralHover: '#E85542',
    mint: '#2DD4A7',
    lilac: '#C9C3FF',
    darkCanvas: '#0D0B1A',
    darkCard: '#151329',
  },
  socials: {
    github: process.env.NEXT_PUBLIC_GITHUB_URL || '',
    x: process.env.NEXT_PUBLIC_X_URL || '',
    discord: process.env.NEXT_PUBLIC_DISCORD_URL || '',
  },
};

export default brandConfig;
