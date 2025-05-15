/**
 * Shortens an Ethereum address to the format: 0x1234...5678
 * @param address - The Ethereum address to shorten
 * @param chars - The number of characters to keep at start and end (default: 4)
 * @returns The shortened address
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address to validate
 * @returns True if the address is valid
 */
export const isValidEthAddress = (address: string): boolean => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Converts an ENS name to an Ethereum address
 * @param ensName - The ENS name to resolve (e.g. "vitalik.eth")
 * @returns The Ethereum address or null if resolution fails
 */
export const resolveEnsName = async (ensName: string): Promise<string | null> => {
  try {
    // This is a placeholder - in a real app this would use ethers.js or similar to resolve the name
    // const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    // return await provider.resolveName(ensName);
    console.log('ENS resolution not implemented');
    return null;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
};

/**
 * Converts an Ethereum address to ENS name if available
 * @param address - The Ethereum address to look up
 * @returns The ENS name or null if not found
 */
export const lookupEnsName = async (address: string): Promise<string | null> => {
  try {
    // This is a placeholder - in a real app this would use ethers.js or similar
    // const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    // return await provider.lookupAddress(address);
    console.log('ENS lookup not implemented');
    return null;
  } catch (error) {
    console.error('Error looking up ENS name:', error);
    return null;
  }
}; 