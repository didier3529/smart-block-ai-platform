export const chainIcons = {
  Ethereum: '/icons/eth.svg',
  Polygon: '/icons/polygon.svg',
  Avalanche: '/icons/avax.svg',
  BSC: '/icons/bnb.svg',
} as const

export type ChainType = keyof typeof chainIcons 