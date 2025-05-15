import { NFTCollection, NFTMarketOverview, NFTAsset, NFTTrade } from '@/lib/types/nft-types';

/**
 * Mock NFT collections for testing and development
 */
export const getMockNFTCollections = (): NFTCollection[] => [
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    name: 'Bored Ape Yacht Club',
    symbol: 'BAYC',
    chain: '0x1',
    totalSupply: 10000,
    floorPrice: 30.5,
    volume24h: 250.75,
    volume7d: 1840.32,
    volumeChange24h: 5.2,
    averagePrice: 32.7,
    marketCap: 305000,
    imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
    verified: true,
  },
  {
    address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
    name: 'Mutant Ape Yacht Club',
    symbol: 'MAYC',
    chain: '0x1',
    totalSupply: 19439,
    floorPrice: 14.2,
    volume24h: 120.43,
    volume7d: 932.17,
    volumeChange24h: -2.8,
    averagePrice: 15.6,
    marketCap: 276033.8,
    imageUrl: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
    verified: true,
  },
  {
    address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    name: 'Azuki',
    symbol: 'AZUKI',
    chain: '0x1',
    totalSupply: 10000,
    floorPrice: 10.8,
    volume24h: 89.34,
    volume7d: 715.26,
    volumeChange24h: 3.6,
    averagePrice: 11.2,
    marketCap: 108000,
    imageUrl: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
    verified: true,
  },
  {
    address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
    name: 'Doodles',
    symbol: 'DOODLE',
    chain: '0x1',
    totalSupply: 10000,
    floorPrice: 2.7,
    volume24h: 32.65,
    volume7d: 198.52,
    volumeChange24h: 1.2,
    averagePrice: 2.92,
    marketCap: 27000,
    imageUrl: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
    verified: true,
  },
  {
    address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    name: 'CryptoPunks',
    symbol: 'PUNK',
    chain: '0x1',
    totalSupply: 10000,
    floorPrice: 50.2,
    volume24h: 325.45,
    volume7d: 2147.33,
    volumeChange24h: 7.5,
    averagePrice: 54.1,
    marketCap: 502000,
    imageUrl: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
    verified: true,
  },
];

/**
 * Mock NFT assets for testing and development
 */
export const getMockNFTAssets = (): NFTAsset[] => [
  {
    tokenId: '1234',
    tokenAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    chain: '0x1',
    ownerOf: '0x123456789abcdef123456789abcdef123456789a',
    name: 'Bored Ape #1234',
    symbol: 'BAYC',
    contractType: 'ERC721',
    tokenUri: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1234',
    imageUrl: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8aQ?w=500&auto=format',
    metadata: {
      name: 'Bored Ape #1234',
      description: 'A bored ape from the Bored Ape Yacht Club collection',
      image: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8aQ?w=500&auto=format',
      attributes: [
        { trait_type: 'Background', value: 'Blue' },
        { trait_type: 'Fur', value: 'Brown' },
        { trait_type: 'Eyes', value: 'Bored' },
        { trait_type: 'Mouth', value: 'Bored Cigarette' },
        { trait_type: 'Clothes', value: 'Striped Tee' },
      ],
    },
  },
  {
    tokenId: '4567',
    tokenAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    chain: '0x1',
    ownerOf: '0x123456789abcdef123456789abcdef123456789a',
    name: 'Bored Ape #4567',
    symbol: 'BAYC',
    contractType: 'ERC721',
    tokenUri: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/4567',
    imageUrl: 'https://i.seadn.io/gae/3tL_z9qv9aibUuPTuCqdkKqIRE0REwSQiQcbGG9F6bGQu2sF_RLBwjzl0iEfRhjJ-6NNCWUMWxWgqRp1vKtIwulzoXH7-n4QPb-5?w=500&auto=format',
    metadata: {
      name: 'Bored Ape #4567',
      description: 'A bored ape from the Bored Ape Yacht Club collection',
      image: 'https://i.seadn.io/gae/3tL_z9qv9aibUuPTuCqdkKqIRE0REwSQiQcbGG9F6bGQu2sF_RLBwjzl0iEfRhjJ-6NNCWUMWxWgqRp1vKtIwulzoXH7-n4QPb-5?w=500&auto=format',
      attributes: [
        { trait_type: 'Background', value: 'Yellow' },
        { trait_type: 'Fur', value: 'Golden' },
        { trait_type: 'Eyes', value: 'Eyepatch' },
        { trait_type: 'Mouth', value: 'Grin' },
        { trait_type: 'Hat', value: 'Fez' },
      ],
    },
  },
  {
    tokenId: '7890',
    tokenAddress: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
    chain: '0x1',
    ownerOf: '0x987654321abcdef987654321abcdef987654321b',
    name: 'Mutant Ape #7890',
    symbol: 'MAYC',
    contractType: 'ERC721',
    tokenUri: 'ipfs://QmPbxeGcXhYQQNgsC6a36dDyYUcHgMLnGKnF8pVFmGsvqi/7890',
    imageUrl: 'https://i.seadn.io/gae/xV-PvsJ-Jnad-HCzUnipQk9NEo9Ybn9wV3-JA28ztXCPXZajb9sEQ4O9maa7Qd5nj0w08cQs7uXGBQKkhi-cHYoJ5MwTvCQCdYEysg?w=500&auto=format',
    metadata: {
      name: 'Mutant Ape #7890',
      description: 'A mutant ape from the Mutant Ape Yacht Club collection',
      image: 'https://i.seadn.io/gae/xV-PvsJ-Jnad-HCzUnipQk9NEo9Ybn9wV3-JA28ztXCPXZajb9sEQ4O9maa7Qd5nj0w08cQs7uXGBQKkhi-cHYoJ5MwTvCQCdYEysg?w=500&auto=format',
      attributes: [
        { trait_type: 'Background', value: 'Green' },
        { trait_type: 'Fur', value: 'Mutant Green' },
        { trait_type: 'Eyes', value: 'Wide Eyed' },
        { trait_type: 'Teeth', value: 'Mutant' },
        { trait_type: 'Clothes', value: 'Sleeveless Tee' },
      ],
    },
  },
  {
    tokenId: '3456',
    tokenAddress: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    chain: '0x1',
    ownerOf: '0xabcdef123456789abcdef123456789abcdef1234',
    name: 'Azuki #3456',
    symbol: 'AZUKI',
    contractType: 'ERC721',
    tokenUri: 'ipfs://Qmf5rhbXkrVWRdvBJgZiQJ8yBQzPKSbsCXQZCPtpPo1d3v/3456',
    imageUrl: 'https://i.seadn.io/gae/kGCPbOzYr7RB_9MT4QzkEZDHCtC-Q88-87JMqSbCVY7LQ7sRjGQ9UQjvN-JzYYZ2YJBK-KeiEwkBOJLZ9hjdqBUBpMdkCkukeh3kHg?w=500&auto=format',
    metadata: {
      name: 'Azuki #3456',
      description: 'An Azuki NFT from the Azuki collection',
      image: 'https://i.seadn.io/gae/kGCPbOzYr7RB_9MT4QzkEZDHCtC-Q88-87JMqSbCVY7LQ7sRjGQ9UQjvN-JzYYZ2YJBK-KeiEwkBOJLZ9hjdqBUBpMdkCkukeh3kHg?w=500&auto=format',
      attributes: [
        { trait_type: 'Background', value: 'Off White' },
        { trait_type: 'Hair', value: 'Long Black' },
        { trait_type: 'Clothing', value: 'Kimono' },
        { trait_type: 'Eyes', value: 'Confident' },
        { trait_type: 'Mouth', value: 'Determined' },
      ],
    },
  },
  {
    tokenId: '6789',
    tokenAddress: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
    chain: '0x1',
    ownerOf: '0xfedcba987654321fedcba987654321fedcba9876',
    name: 'Doodle #6789',
    symbol: 'DOODLE',
    contractType: 'ERC721',
    tokenUri: 'ipfs://QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS/6789',
    imageUrl: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
    metadata: {
      name: 'Doodle #6789',
      description: 'A Doodle NFT from the Doodles collection',
      image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
      attributes: [
        { trait_type: 'Background', value: 'Pink' },
        { trait_type: 'Face', value: 'Happy' },
        { trait_type: 'Hair', value: 'Curly' },
        { trait_type: 'Body', value: 'Rainbow' },
        { trait_type: 'Pet', value: 'None' },
      ],
    },
  },
];

/**
 * Mock NFT market overview for testing and development
 */
export const getMockNFTMarketOverview = (): NFTMarketOverview => {
  const collections = getMockNFTCollections();
  
  // Create mock NFT trades
  const recentSales: NFTTrade[] = [
    {
      transaction_hash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      transaction_index: '0',
      token_ids: ['1234'],
      seller_address: '0x123456789abcdef123456789abcdef123456789a',
      buyer_address: '0x987654321abcdef987654321abcdef987654321b',
      marketplace_address: '0x00000000006c3852cbef3e08e8df289169ede581',
      price: '35.5',
      price_token_address: '0x0000000000000000000000000000000000000000',
      block_timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      block_number: '17500000',
      chain: '0x1',
    },
    {
      transaction_hash: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
      transaction_index: '0',
      token_ids: ['7890'],
      seller_address: '0xfedcba987654321fedcba987654321fedcba9876',
      buyer_address: '0x987654321abcdef987654321abcdef987654321b',
      marketplace_address: '0x00000000006c3852cbef3e08e8df289169ede581',
      price: '15.2',
      price_token_address: '0x0000000000000000000000000000000000000000',
      block_timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
      block_number: '17499950',
      chain: '0x1',
    },
    {
      transaction_hash: '0x56789abcdef123456789abcdef123456789abcdef123456789abcdef12345678',
      transaction_index: '0',
      token_ids: ['3456'],
      seller_address: '0x123456789abcdef123456789abcdef123456789a',
      buyer_address: '0xabcdef123456789abcdef123456789abcdef1234',
      marketplace_address: '0x00000000006c3852cbef3e08e8df289169ede581',
      price: '12.5',
      price_token_address: '0x0000000000000000000000000000000000000000',
      block_timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      block_number: '17499900',
      chain: '0x1',
    },
    {
      transaction_hash: '0x9abcdef123456789abcdef123456789abcdef123456789abcdef123456789abc',
      transaction_index: '0',
      token_ids: ['6789'],
      seller_address: '0x987654321abcdef987654321abcdef987654321b',
      buyer_address: '0xfedcba987654321fedcba987654321fedcba9876',
      marketplace_address: '0x00000000006c3852cbef3e08e8df289169ede581',
      price: '3.1',
      price_token_address: '0x0000000000000000000000000000000000000000',
      block_timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
      block_number: '17499850',
      chain: '0x1',
    },
    {
      transaction_hash: '0xf123456789abcdef123456789abcdef123456789abcdef123456789abcdef123',
      transaction_index: '0',
      token_ids: ['4567'],
      seller_address: '0xabcdef123456789abcdef123456789abcdef1234',
      buyer_address: '0x123456789abcdef123456789abcdef123456789a',
      marketplace_address: '0x00000000006c3852cbef3e08e8df289169ede581',
      price: '32.8',
      price_token_address: '0x0000000000000000000000000000000000000000',
      block_timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      block_number: '17499800',
      chain: '0x1',
    },
  ];
  
  // Calculate market stats
  const totalVolume24h = collections.reduce((acc, collection) => acc + collection.volume24h, 0);
  const totalVolume7d = collections.reduce((acc, collection) => acc + collection.volume7d, 0);
  const volumeChange24h = totalVolume7d > 0 
    ? ((totalVolume24h / (totalVolume7d / 7)) - 1) * 100 
    : 0;
  const totalSales24h = recentSales.length;
  const totalValue = recentSales.reduce((acc, sale) => acc + parseFloat(sale.price), 0);
  const averagePrice24h = totalSales24h > 0 ? totalValue / totalSales24h : 0;
  
  return {
    topCollections: collections,
    recentSales,
    marketStats: {
      totalVolume24h,
      totalVolume7d,
      volumeChange24h,
      averagePrice24h,
      totalSales24h,
    }
  };
}; 