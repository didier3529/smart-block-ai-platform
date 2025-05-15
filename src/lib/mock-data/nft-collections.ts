import { NFTCollection } from '../types/nft-types';

// Primary blue-chip NFT collections
export const POPULAR_COLLECTION_ADDRESSES = [
  "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // Bored Ape Yacht Club
  "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB", // CryptoPunks
  "0xbd3531da5cf5857e7cfaa92426877b022e612cf8", // Pudgy Penguins
  "0xED5AF388653567Af2F388E6224dC7C4b3241C544", // Azuki
  "0x60E4d786628Fea6478F785A6d7e704777c86a7c6", // Mutant Ape Yacht Club
  "0x23581767a106ae21c074b2276D25e5C3e136a68b", // Moonbirds
  "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B", // CloneX
  "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e", // Doodles
  "0x1A92f7381B9F03921564a437210bB9396471050C", // Cool Cats
  "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7", // Meebits
];

// Manually curated collection data for fallback
export const MOCK_COLLECTIONS: NFTCollection[] = [
  {
    id: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    contractAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    name: "Bored Ape Yacht Club",
    chain: "ethereum",
    description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain.",
    imageUrl: "https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format",
    floorPrice: "30.5",
    floorPriceCurrency: "ETH",
    volume24h: "2.3",
    volumeTotal: "1250",
    volumeCurrency: "ETH",
    totalSupply: 10000,
    numOwners: 6452,
    averagePrice24h: "32.1",
    marketCap: "305000",
    slug: "boredapeyachtclub"
  },
  {
    id: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    name: "CryptoPunks",
    chain: "ethereum", 
    description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard.",
    imageUrl: "https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format",
    floorPrice: "48.2",
    floorPriceCurrency: "ETH",
    volume24h: "2.3",
    volumeTotal: "950",
    volumeCurrency: "ETH",
    totalSupply: 10000,
    numOwners: 3725,
    averagePrice24h: "49.5",
    marketCap: "482000",
    slug: "cryptopunks"
  },
  {
    id: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
    contractAddress: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
    name: "Pudgy Penguins",
    chain: "ethereum",
    description: "Pudgy Penguins is a collection of 8,888 NFTs on the Ethereum blockchain.",
    imageUrl: "https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqIDgOV?w=500&auto=format",
    floorPrice: "5.8",
    floorPriceCurrency: "ETH",
    volume24h: "3.5",
    volumeTotal: "580",
    volumeCurrency: "ETH",
    totalSupply: 8888,
    numOwners: 3254,
    averagePrice24h: "5.9",
    marketCap: "51892.8",
    slug: "pudgy-penguins"
  },
  {
    id: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
    contractAddress: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
    name: "Azuki",
    chain: "ethereum",
    description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden.",
    imageUrl: "https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format",
    floorPrice: "8.23",
    floorPriceCurrency: "ETH",
    volume24h: "4.2",
    volumeTotal: "725",
    volumeCurrency: "ETH",
    totalSupply: 10000,
    numOwners: 4825,
    averagePrice24h: "8.5",
    marketCap: "82300",
    slug: "azuki"
  },
  {
    id: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
    contractAddress: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
    name: "Mutant Ape Yacht Club",
    chain: "ethereum",
    description: "The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale.",
    imageUrl: "https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format",
    floorPrice: "11.75",
    floorPriceCurrency: "ETH",
    volume24h: "3.1",
    volumeTotal: "890",
    volumeCurrency: "ETH",
    totalSupply: 20000,
    numOwners: 12356,
    averagePrice24h: "12.1",
    marketCap: "235000",
    slug: "mutant-ape-yacht-club"
  },
  {
    id: "0x23581767a106ae21c074b2276D25e5C3e136a68b",
    contractAddress: "0x23581767a106ae21c074b2276D25e5C3e136a68b",
    name: "Moonbirds",
    chain: "ethereum",
    description: "A collection of 10,000 utility-enabled PFPs that feature a richly diverse and unique pool of rarity-powered traits.",
    imageUrl: "https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5vojLdQX2LR91uRH_bniMmwUlCUbWOevX9WY-MeiUQYS6?w=500&auto=format",
    floorPrice: "3.57",
    floorPriceCurrency: "ETH",
    volume24h: "1.2",
    volumeTotal: "450",
    volumeCurrency: "ETH",
    totalSupply: 10000,
    numOwners: 6547,
    averagePrice24h: "3.65",
    marketCap: "35700",
    slug: "moonbirds"
  },
  {
    id: "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B",
    contractAddress: "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B",
    name: "CloneX",
    chain: "ethereum",
    description: "CLONE X IS A COLLECTION OF 20,000 NEXT-GEN AVATARS, CREATED IN COLLABORATION WITH RTFKT AND TAKASHI MURAKAMI.",
    imageUrl: "https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format",
    floorPrice: "2.45",
    floorPriceCurrency: "ETH",
    volume24h: "2.8",
    volumeTotal: "520",
    volumeCurrency: "ETH",
    totalSupply: 20000,
    numOwners: 9784,
    averagePrice24h: "2.53",
    marketCap: "49000",
    slug: "clonex"
  },
  {
    id: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
    contractAddress: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
    name: "Doodles",
    chain: "ethereum",
    description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000.",
    imageUrl: "https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format",
    floorPrice: "2.14",
    floorPriceCurrency: "ETH",
    volume24h: "1.7",
    volumeTotal: "340",
    volumeCurrency: "ETH",
    totalSupply: 10000,
    numOwners: 4876,
    averagePrice24h: "2.2",
    marketCap: "21400",
    slug: "doodles-official"
  }
]; 