import NFTItemView from '@/components/nft/NFTItemView';
import { Metadata } from 'next';

interface NFTItemPageProps {
  params: {
    address: string;
    tokenId: string;
  };
}

export async function generateMetadata(
  { params }: NFTItemPageProps
): Promise<Metadata> {
  return {
    title: `NFT ${params.tokenId} - ${params.address.substring(0, 6)}... - ChainOracle`,
    description: 'View details of this NFT including metadata, attributes, and ownership history',
  };
}

export default function NFTItemPage({ params }: NFTItemPageProps) {
  return <NFTItemView collectionAddress={params.address} tokenId={params.tokenId} />;
} 