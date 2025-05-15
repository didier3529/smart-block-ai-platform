import { NFT, NFTCollection, NFTMarketplaceStats, NFTMetadata, NFTTrait, NFTOwner, PaginatedCollectionResponse, PaginatedNFTResponse, NFTQueryFilters } from '../types/nft-types';
import { NFTMarketOverview } from '@/lib/types/nft-types';

// --- Mock Individual NFTs ---
export const mockNftTrait1: NFTTrait = {
  trait_type: 'Background',
  value: 'Blue',
  display_type: 'color',
  trait_count: 100,
};

export const mockNftTrait2: NFTTrait = {
  trait_type: 'Eyes',
  value: 'Laser',
  trait_count: 50,
};

export const mockNftMetadata1: NFTMetadata = {
  name: 'Cool Ape #1',
  description: 'A very cool ape, part of the Cool Apes collection.',
  image: 'https://via.placeholder.com/300/FF0000/FFFFFF?Text=CoolApe1',
  external_url: 'https://coolapes.example.com/1',
  attributes: [mockNftTrait1, mockNftTrait2],
};

export const mockNftOwner1: NFTOwner = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  quantity: 1,
};

export const mockNft1: NFT = {
  tokenId: '1',
  contractAddress: '0xCollectionContractAddress1',
  name: 'Cool Ape #1',
  description: 'A very cool ape.',
  imageUrl: 'https://via.placeholder.com/300/FF0000/FFFFFF?Text=CoolApe1',
  metadataUrl: 'ipfs://QmWME.../1.json',
  metadata: mockNftMetadata1,
  owner: mockNftOwner1,
  creatorAddress: '0xCreatorAddress1',
  chain: 'ethereum',
  tokenStandard: 'ERC721',
  lastSalePrice: '1.5',
  lastSaleCurrency: 'ETH',
  listingPrice: '2.0',
  listingCurrency: 'ETH',
  isListed: true,
  rarityScore: 85.5,
  rarityRank: 120,
};

export const mockNft2: NFT = {
  tokenId: '2',
  contractAddress: '0xCollectionContractAddress1',
  name: 'Rare Robot #42',
  description: 'A rare robot with special features.',
  imageUrl: 'https://via.placeholder.com/300/00FF00/FFFFFF?Text=Robot42',
  metadata: { name: 'Rare Robot #42', image: 'https://via.placeholder.com/300/00FF00/FFFFFF?Text=Robot42' },
  owner: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
  chain: 'polygon',
  tokenStandard: 'ERC721',
  listingPrice: '500',
  listingCurrency: 'MATIC',
  isListed: true,
};

export const mockNft3: NFT = {
  tokenId: '101',
  contractAddress: '0xAnotherCollectionAddress2',
  name: 'Pixel Art #101',
  description: 'A unique piece of pixel art.',
  imageUrl: 'https://via.placeholder.com/300/0000FF/FFFFFF?Text=Pixel101',
  owner: { address: '0x1234567890abcdef1234567890abcdef12345678' },
  chain: 'ethereum',
  tokenStandard: 'ERC1155',
  isListed: false,
};

// Array of all individual mock NFTs
export const mockNfts: NFT[] = [mockNft1, mockNft2, mockNft3];

// --- Mock NFT Collections ---
export const mockCollection1: NFTCollection = {
  id: '0xCollectionContractAddress1',
  name: 'Cool Apes Collection',
  contractAddress: '0xCollectionContractAddress1',
  chain: 'ethereum',
  description: 'A collection of 10,000 uniquely generated Cool Apes.',
  imageUrl: 'https://via.placeholder.com/400x200/CCCCCC/000000?Text=CoolApesBanner',
  externalUrl: 'https://coolapes.example.com',
  creatorAddress: '0xCreatorAddress1',
  totalSupply: 10000,
  numOwners: 4500,
  floorPrice: '1.8',
  floorPriceCurrency: 'ETH',
  volume24h: '150.5',
  volumeTotal: '12000.0',
  volumeCurrency: 'ETH',
  averagePrice24h: '2.1',
  marketCap: '18000',
  nfts: [mockNft1, mockNft2], // Including some NFTs from this collection
  slug: 'cool-apes-collection',
  createdAt: new Date('2023-01-15T10:00:00Z').toISOString(),
};

export const mockCollection2: NFTCollection = {
  id: '0xAnotherCollectionAddress2',
  name: 'Pixel Wonders',
  contractAddress: '0xAnotherCollectionAddress2',
  chain: 'polygon',
  description: 'A limited series of pixel art wonders.',
  imageUrl: 'https://via.placeholder.com/400x200/AAAAAA/FFFFFF?Text=PixelWonders',
  totalSupply: 1000,
  numOwners: 300,
  floorPrice: '80',
  floorPriceCurrency: 'MATIC',
  volume24h: '5000',
  volumeTotal: '250000',
  volumeCurrency: 'MATIC',
  slug: 'pixel-wonders',
  nfts: [mockNft3],
  createdAt: new Date('2023-03-01T12:00:00Z').toISOString(),
};

export const mockCollections: NFTCollection[] = [mockCollection1, mockCollection2];

// --- Mock Marketplace Stats ---
export const mockMarketplaceStats: NFTMarketplaceStats = {
  totalVolume24h: '12500.75',
  totalVolumeCurrency: 'ETH',
  totalSales24h: 850,
  activeCollections: 152,
  uniqueTraders24h: 3200,
  averageNftPrice24h: '0.85',
  trendingCollections: [mockCollection1, mockCollection2], // Top 2 for simplicity
};

// --- Mock Paginated Responses ---
export const mockPaginatedNfts: PaginatedNFTResponse = {
  nfts: [mockNft1, mockNft2, mockNft3],
  totalItems: 3,
  totalPages: 1,
  currentPage: 1,
  pageSize: 10,
};

export const mockPaginatedCollections: PaginatedCollectionResponse = {
  collections: [mockCollection1, mockCollection2],
  totalItems: 2,
  totalPages: 1,
  currentPage: 1,
  pageSize: 10,
};

// Mock NFT Market data for use when API is unavailable
const mockNFTMarket: NFTMarketOverview = {
  trending: [
    {
      collection_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
      verified_collection: true,
      floor_price: 30.5,
      floor_price_24hr_percent_change: 2.3,
      volume_usd: 3450000,
      items_total: 10000,
      sales_count: 28,
      owners_count: 6452
    },
    {
      collection_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
      verified_collection: true,
      floor_price: 12.8,
      floor_price_24hr_percent_change: -1.5,
      volume_usd: 1520000,
      items_total: 20000,
      sales_count: 42,
      owners_count: 12356
    },
    {
      collection_address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      name: 'Doodles',
      image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
      verified_collection: true,
      floor_price: 5.6,
      floor_price_24hr_percent_change: 0.8,
      volume_usd: 620000,
      items_total: 10000,
      sales_count: 35,
      owners_count: 4876
    },
    {
      collection_address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      name: 'Azuki',
      image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
      verified_collection: true,
      floor_price: 8.9,
      floor_price_24hr_percent_change: 1.2,
      volume_usd: 850000,
      items_total: 10000,
      sales_count: 31,
      owners_count: 4825
    },
    {
      collection_address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      name: 'CryptoPunks',
      image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
      verified_collection: true,
      floor_price: 50.2,
      floor_price_24hr_percent_change: -0.5,
      volume_usd: 4200000,
      items_total: 10000,
      sales_count: 15,
      owners_count: 3725
    },
    {
      collection_address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      name: 'CloneX',
      image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
      verified_collection: true,
      floor_price: 7.1,
      floor_price_24hr_percent_change: 3.2,
      volume_usd: 780000,
      items_total: 20000,
      sales_count: 28,
      owners_count: 9784
    },
    {
      collection_address: '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258',
      name: 'Otherdeed for Otherside',
      image: 'https://i.seadn.io/gae/yIm-M5-BpSDdTEIJRt5D6xphizhIdozXjqSITgK4phWq7MmAU3qE7Nw7POGCiPGyhtJ3ZFP8iJ29TFl-RLcGBWX5qI4-ZcnCPcsY4zI?w=500&auto=format',
      verified_collection: true,
      floor_price: 2.1,
      floor_price_24hr_percent_change: -0.7,
      volume_usd: 450000,
      items_total: 100000,
      sales_count: 85,
      owners_count: 34678
    },
    {
      collection_address: '0xba30e5f9bb24caa003e9f2f0497ad287fdf95623',
      name: 'Bored Ape Kennel Club',
      image: 'https://i.seadn.io/gae/l1wZXP2hHFUQ3turU5VQ9PpgVVasyQ79-ChvCgjoU5xKkBA50OGoJqKZeMOR-qLrzqwIfd1HpYmiv23JWm0EZ14owiPYaufqzmj1?w=500&auto=format',
      verified_collection: true,
      floor_price: 6.5,
      floor_price_24hr_percent_change: 0.3,
      volume_usd: 380000,
      items_total: 10000,
      sales_count: 22,
      owners_count: 5124
    }
  ],
  top: [
    {
      collection_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
      verified_collection: true,
      floor_price: 30.5,
      floor_price_24hr_percent_change: 2.3,
      volume_usd: 3450000,
      items_total: 10000,
      sales_count: 28,
      owners_count: 6452,
      description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain."
    },
    {
      collection_address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      name: 'CryptoPunks',
      image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
      verified_collection: true,
      floor_price: 50.2,
      floor_price_24hr_percent_change: -0.5,
      volume_usd: 4200000,
      items_total: 10000,
      sales_count: 15,
      owners_count: 3725,
      description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard."
    },
    {
      collection_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
      verified_collection: true,
      floor_price: 12.8,
      floor_price_24hr_percent_change: -1.5,
      volume_usd: 1520000,
      items_total: 20000,
      sales_count: 42,
      owners_count: 12356,
      description: "The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale."
    },
    {
      collection_address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      name: 'Azuki',
      image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
      verified_collection: true,
      floor_price: 8.9,
      floor_price_24hr_percent_change: 1.2,
      volume_usd: 850000,
      items_total: 10000,
      sales_count: 31,
      owners_count: 4825,
      description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden."
    },
    {
      collection_address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      name: 'Doodles',
      image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
      verified_collection: true,
      floor_price: 5.6,
      floor_price_24hr_percent_change: 0.8,
      volume_usd: 620000,
      items_total: 10000,
      sales_count: 35,
      owners_count: 4876,
      description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000."
    },
    {
      collection_address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      name: 'CloneX',
      image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
      verified_collection: true,
      floor_price: 7.1,
      floor_price_24hr_percent_change: 3.2,
      volume_usd: 780000,
      items_total: 20000,
      sales_count: 28,
      owners_count: 9784,
      description: "CLONE X IS A COLLECTION OF 20,000 NEXT-GEN AVATARS, CREATED IN COLLABORATION WITH RTFKT AND TAKASHI MURAKAMI."
    },
    {
      collection_address: '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258',
      name: 'Otherdeed for Otherside',
      image: 'https://i.seadn.io/gae/yIm-M5-BpSDdTEIJRt5D6xphizhIdozXjqSITgK4phWq7MmAU3qE7Nw7POGCiPGyhtJ3ZFP8iJ29TFl-RLcGBWX5qI4-ZcnCPcsY4zI?w=500&auto=format',
      verified_collection: true,
      floor_price: 2.1,
      floor_price_24hr_percent_change: -0.7,
      volume_usd: 450000,
      items_total: 100000,
      sales_count: 85,
      owners_count: 34678,
      description: "Otherdeed is the key to claiming land in Otherside. Each have a unique blend of environment and sediment — some with resources, some home to powerful artifacts."
    },
    {
      collection_address: '0xba30e5f9bb24caa003e9f2f0497ad287fdf95623',
      name: 'Bored Ape Kennel Club',
      image: 'https://i.seadn.io/gae/l1wZXP2hHFUQ3turU5VQ9PpgVVasyQ79-ChvCgjoU5xKkBA50OGoJqKZeMOR-qLrzqwIfd1HpYmiv23JWm0EZ14owiPYaufqzmj1?w=500&auto=format',
      verified_collection: true,
      floor_price: 6.5,
      floor_price_24hr_percent_change: 0.3,
      volume_usd: 380000,
      items_total: 10000,
      sales_count: 22,
      owners_count: 5124,
      description: "The Bored Ape Kennel Club is a collection of 10,000 NFTs that extend the Bored Ape Yacht Club ecosystem."
    }
  ],
  walletNFTs: [
    {
      token_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      token_id: '8520',
      contract_type: 'ERC721',
      owner_of: '0x0000000000000000000000000000000000000000',
      block_number: '12345678',
      block_number_minted: '12345678',
      token_uri: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/8520',
      metadata: JSON.stringify({
        image: 'ipfs://QmYx6GsYAKnNzZ9A6NvEKV9nf1VaDzJrqDR23Y8YSkebLU/8520.png',
        attributes: [
          { trait_type: 'Fur', value: 'Golden Brown' },
          { trait_type: 'Eyes', value: 'Bored' },
          { trait_type: 'Background', value: 'Orange' },
          { trait_type: 'Clothes', value: 'Striped Tee' },
          { trait_type: 'Mouth', value: 'Bored Cigarette' }
        ]
      }),
      normalized_metadata: {
        name: 'Bored Ape #8520',
        description: 'Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs',
        image: 'https://i.seadn.io/gae/NQqF3so-E2IvvhHrJHVsrPrJMOvBYXN3Mr6HM7j0kOUaQ2qSQlCDuRmDNZkzZ_-FQoOUXIKG6C9CnXqt0hKCYIvs2lBpwN-L_hKswA',
        attributes: [
          { trait_type: 'Fur', value: 'Golden Brown' },
          { trait_type: 'Eyes', value: 'Bored' },
          { trait_type: 'Background', value: 'Orange' },
          { trait_type: 'Clothes', value: 'Striped Tee' },
          { trait_type: 'Mouth', value: 'Bored Cigarette' }
        ]
      },
      amount: '1',
      name: 'Bored Ape Yacht Club',
      symbol: 'BAYC',
      last_token_uri_sync: '2023-09-25T12:20:35.319Z',
      last_metadata_sync: '2023-09-25T12:20:42.756Z',
      media: {
        media_collection: {
          low: { url: 'https://nft-preview-media.s3.us-east-1.amazonaws.com/evm/0x1/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0x00000000000000000000000000000000000000000000000000000000000021489aca79d9c90db779b59a090f9cb1f0fb1e7a7bcb29107f7f7689e67bad000/low.png' },
          medium: { url: 'https://nft-preview-media.s3.us-east-1.amazonaws.com/evm/0x1/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0x00000000000000000000000000000000000000000000000000000000000021489aca79d9c90db779b59a090f9cb1f0fb1e7a7bcb29107f7f7689e67bad000/medium.png' },
          high: { url: 'https://nft-preview-media.s3.us-east-1.amazonaws.com/evm/0x1/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0x00000000000000000000000000000000000000000000000000000000000021489aca79d9c90db779b59a090f9cb1f0fb1e7a7bcb29107f7f7689e67bad000/high.png' },
          original: { url: 'https://ipfs.moralis.io:2053/ipfs/QmYx6GsYAKnNzZ9A6NvEKV9nf1VaDzJrqDR23Y8YSkebLU/8520.png' }
        }
      }
    },
    {
      token_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      token_id: '12345',
      contract_type: 'ERC721',
      owner_of: '0x0000000000000000000000000000000000000000',
      block_number: '12345678',
      block_number_minted: '12345678',
      token_uri: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/12345',
      normalized_metadata: {
        name: 'Mutant Ape #12345',
        description: 'Mutant Ape Yacht Club is a collection of up to 20,000 Mutant Apes',
        image: 'https://i.seadn.io/gae/CyMBAZXo5RMTZS4LNzGGZXCs1z1xkJCMdgUxhmJpFhm2DTMr_QlAJ2Y1Y2YSNpX7D5ghT-WFPrA18Zf-chCxA23oFPV_GHjOQc_S?w=500&auto=format',
        attributes: [
          { trait_type: 'Background', value: 'Purple' },
          { trait_type: 'Clothes', value: 'Striped Tee' },
          { trait_type: 'Eyes', value: 'Wide Eyed' },
          { trait_type: 'Fur', value: 'Green' },
          { trait_type: 'Mouth', value: 'Grin' }
        ]
      },
      amount: '1',
      name: 'Mutant Ape Yacht Club',
      symbol: 'MAYC',
      last_token_uri_sync: '2023-09-25T12:20:35.319Z',
      last_metadata_sync: '2023-09-25T12:20:42.756Z'
    },
    {
      token_address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      token_id: '4578',
      contract_type: 'ERC721',
      owner_of: '0x0000000000000000000000000000000000000000',
      block_number: '12345679',
      block_number_minted: '12345679',
      token_uri: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/4578',
      normalized_metadata: {
        name: 'Doodle #4578',
        description: 'A community-driven collectibles project featuring art by Burnt Toast.',
        image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
        attributes: [
          { trait_type: 'Background', value: 'Blue' },
          { trait_type: 'Hair', value: 'Pink Short' },
          { trait_type: 'Body', value: 'Alien' },
          { trait_type: 'Face', value: 'Happy' },
          { trait_type: 'Head', value: 'None' }
        ]
      },
      amount: '1',
      name: 'Doodles',
      symbol: 'DOODLE',
      last_token_uri_sync: '2023-09-25T12:20:35.319Z',
      last_metadata_sync: '2023-09-25T12:20:42.756Z'
    }
  ]
};

export default mockNFTMarket; 