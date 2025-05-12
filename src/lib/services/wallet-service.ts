import { parseUnits } from "ethers/lib/utils"

const METAMASK_API_KEY = '3c502f6030be41ba86bb45e6d0c08788';

// Network configurations
const NETWORK_CONFIGS = {
  "0x1": {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [`https://mainnet.infura.io/v3/${METAMASK_API_KEY}`],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  "0x89": {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: [`https://polygon-mainnet.infura.io/v3/${METAMASK_API_KEY}`],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  "0x38": {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  }
};

// Use bigint for all balances
export interface WalletBalances {
  [token: string]: bigint
}

// In a real implementation, this would connect to MetaMask/WalletConnect
// and fetch real balances from the blockchain
export async function getWalletBalances(): Promise<WalletBalances> {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock balances for demonstration
    return {
      ETH: parseUnits("10", 18), // 10 ETH
      BTC: parseUnits("0.5", 18), // 0.5 BTC (wrapped)
      USDC: parseUnits("5000", 18), // 5000 USDC
    }
  } catch (error) {
    console.error("Wallet Service Error:", error)
    throw new Error("Failed to fetch wallet balances")
  }
}

export async function connectWallet(): Promise<string> {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === "undefined") {
      throw new Error("Please install MetaMask to connect your wallet")
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    // Return the first account
    return accounts[0]
  } catch (error) {
    console.error("Wallet Connection Error:", error)
    throw error
  }
}

export async function getChainId(): Promise<string> {
  try {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    })
    return chainId
  } catch (error) {
    console.error("Chain ID Error:", error)
    throw error
  }
}

export async function switchNetwork(chainId: string): Promise<void> {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    })
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      await addNetwork(chainId)
    } else {
      throw error
    }
  }
}

async function addNetwork(chainId: string): Promise<void> {
  const networkConfig = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
  
  if (!networkConfig) {
    throw new Error("Unsupported network")
  }

  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [networkConfig],
  })
}

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (params?: any) => void) => void
      removeListener: (event: string, callback: (params?: any) => void) => void
    }
  }
} 