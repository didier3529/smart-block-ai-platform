import { useAuth } from '@/lib/providers/auth-provider';
import { useStore } from '@/lib/store';
import { NetworkType } from '@/types/blockchain';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Icons } from '../ui/icons';

const networks: { id: NetworkType; name: string; icon: keyof typeof Icons }[] = [
  { id: 'ethereum', name: 'Ethereum', icon: 'ethereum' },
  { id: 'polygon', name: 'Polygon', icon: 'polygon' },
  { id: 'bsc', name: 'BNB Chain', icon: 'binance' },
  { id: 'arbitrum', name: 'Arbitrum', icon: 'arbitrum' },
  { id: 'optimism', name: 'Optimism', icon: 'optimism' },
];

export function Navbar() {
  const { user, disconnectWallet } = useAuth();
  const { theme, setTheme } = useTheme();
  const { selectedNetwork, setSelectedNetwork } = useStore();

  const selectedNetworkData = networks.find((n) => n.id === selectedNetwork);
  const NetworkIcon = selectedNetworkData ? Icons[selectedNetworkData.icon] : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {NetworkIcon && <NetworkIcon className="h-4 w-4" />}
                {selectedNetworkData?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {networks.map((network) => {
                const Icon = Icons[network.icon];
                return (
                  <DropdownMenuItem
                    key={network.id}
                    onClick={() => setSelectedNetwork(network.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {network.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Icons.sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Icons.moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Icons.user className="h-5 w-5" />
                {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => disconnectWallet()}>
                <Icons.logout className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 