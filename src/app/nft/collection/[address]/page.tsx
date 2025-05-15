import NFTCollectionView from '@/components/nft/NFTCollectionView';
import { Metadata } from 'next';

interface NFTCollectionPageProps {
  params: {
    address: string;
  };
}

export async function generateMetadata(
  { params }: NFTCollectionPageProps
): Promise<Metadata> {
  return {
    title: `NFT Collection ${params.address.substring(0, 6)}... - ChainOracle`,
    description: 'View details of this NFT collection including stats, floor price, and available NFTs',
  };
}

export default function NFTCollectionPage({ params }: NFTCollectionPageProps) {
  return <NFTCollectionView collectionAddress={params.address} />;
} 