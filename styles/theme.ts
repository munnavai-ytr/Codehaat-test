/**
 * Design System "Aurora Glass" Tokens
 */
export const AURORA_TOKENS = {
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
  radii: {
    card: '24px',
    button: '16px',
    input: '16px',
  },
  typography: {
    headings: 'Plus Jakarta Sans, Hind Siliguri, sans-serif',
    body: 'Inter, Hind Siliguri, sans-serif',
  },
  transitions: {
    default: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
    spring: { type: 'spring', damping: 28, stiffness: 300 },
  },
} as const;
