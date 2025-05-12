import { BaseDataSource, DataSourceConfig } from './BaseDataSource';
import { ContractDataSource, ContractDataConfig } from './ContractDataSource';
import { ethers } from 'ethers';

export interface NFTDataConfig extends DataSourceConfig {
  contractDataConfig: ContractDataConfig;
  ipfsGateway?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface NFTSale {
  tokenId: string;
  price: number;
  seller: string;
  buyer: string;
  timestamp: number;
  marketplace: string;
}

export class NFTDataSource extends BaseDataSource {
  private contractDataSource: ContractDataSource;
  private readonly config: NFTDataConfig;

  constructor(config: NFTDataConfig) {
    super(config);
    this.config = {
      ipfsGateway: 'https://ipfs.io/ipfs/',
      ...config
    };
    this.contractDataSource = new ContractDataSource(config.contractDataConfig);
    this.validateConfig();
  }

  async connect(): Promise<void> {
    await this.contractDataSource.connect();
    this.isConnected = true;
    this.emit('connected');

    // Forward contract events
    this.contractDataSource.on('contractEvent', (event) => {
      this.emit('contractEvent', event);
    });

    this.contractDataSource.on('error', (error) => {
      this.handleError(error.error, error.context);
    });
  }

  async disconnect(): Promise<void> {
    await this.contractDataSource.disconnect();
    this.isConnected = false;
  }

  async isHealthy(): Promise<boolean> {
    return this.contractDataSource.isHealthy();
  }

  async getTokenMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<NFTMetadata> {
    return this.executeWithRetry(async () => {
      // Get token URI from contract
      const contract = new ethers.Contract(
        contractAddress,
        ['function tokenURI(uint256) view returns (string)'],
        this.contractDataSource['provider']
      );

      let uri = await contract.tokenURI(tokenId);

      // Handle IPFS URIs
      if (uri.startsWith('ipfs://')) {
        uri = uri.replace('ipfs://', this.config.ipfsGateway!);
      }

      // Fetch metadata
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return this.validateMetadata(metadata);
    });
  }

  async getCollectionStats(
    contractAddress: string,
    startBlock?: number,
    endBlock?: number
  ): Promise<{
    totalSupply: number;
    holders: number;
    floorPrice?: number;
    volumeTraded: number;
  }> {
    const contract = new ethers.Contract(
      contractAddress,
      [
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)'
      ],
      this.contractDataSource['provider']
    );

    const [totalSupply, transferEvents] = await Promise.all([
      contract.totalSupply(),
      this.contractDataSource.getLogs({
        address: contractAddress,
        topics: [ethers.utils.id('Transfer(address,address,uint256)')],
        fromBlock: startBlock,
        toBlock: endBlock
      })
    ]);

    // Process transfer events to get unique holders
    const holders = new Set<string>();
    for (const event of transferEvents) {
      const [from, to] = event.topics.slice(1).map(topic => 
        ethers.utils.getAddress(ethers.utils.hexDataSlice(topic, 12))
      );
      if (to !== ethers.constants.AddressZero) {
        holders.add(to);
      }
      if (from !== ethers.constants.AddressZero) {
        holders.delete(from);
      }
    }

    // Get sales data
    const sales = await this.getSales(contractAddress, startBlock, endBlock);
    const volumeTraded = sales.reduce((sum, sale) => sum + sale.price, 0);
    const floorPrice = sales.length > 0 
      ? Math.min(...sales.map(s => s.price))
      : undefined;

    return {
      totalSupply: totalSupply.toNumber(),
      holders: holders.size,
      floorPrice,
      volumeTraded
    };
  }

  async getSales(
    contractAddress: string,
    startBlock?: number,
    endBlock?: number
  ): Promise<NFTSale[]> {
    // Get transfer events with value (sales)
    const events = await this.contractDataSource.getLogs({
      address: contractAddress,
      topics: [ethers.utils.id('Transfer(address,address,uint256)')],
      fromBlock: startBlock,
      toBlock: endBlock
    });

    const sales: NFTSale[] = [];
    for (const event of events) {
      // Check if transfer had value (was a sale)
      const tx = await this.contractDataSource['provider'].getTransaction(
        event.transactionHash
      );
      if (tx.value.gt(0)) {
        const [from, to] = event.topics.slice(1).map(topic =>
          ethers.utils.getAddress(ethers.utils.hexDataSlice(topic, 12))
        );
        const tokenId = ethers.BigNumber.from(event.topics[3]).toString();

        sales.push({
          tokenId,
          price: parseFloat(ethers.utils.formatEther(tx.value)),
          seller: from,
          buyer: to,
          timestamp: (await tx.wait()).timestamp,
          marketplace: tx.to // The contract that facilitated the sale
        });
      }
    }

    return sales;
  }

  private validateMetadata(metadata: any): NFTMetadata {
    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error('Invalid metadata: missing or invalid name');
    }
    if (!metadata.description || typeof metadata.description !== 'string') {
      throw new Error('Invalid metadata: missing or invalid description');
    }
    if (!metadata.image || typeof metadata.image !== 'string') {
      throw new Error('Invalid metadata: missing or invalid image');
    }
    if (!Array.isArray(metadata.attributes)) {
      throw new Error('Invalid metadata: missing or invalid attributes array');
    }

    return {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      attributes: metadata.attributes.map(attr => ({
        trait_type: attr.trait_type,
        value: attr.value
      }))
    };
  }

  protected validateConfig(): void {
    super.validateConfig();
    if (!this.config.contractDataConfig?.rpcUrl) {
      throw new Error('RPC URL is required in contractDataConfig');
    }
  }
} 