import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, Shield, ArrowRight, Check, AlertTriangle } from 'lucide-react';

interface WalletConnectionTutorialProps {
  onComplete?: () => void;
  walletConnected: boolean;
  onConnectWallet: () => void;
  walletAddress?: string;
}

export function WalletConnectionTutorial({
  onComplete,
  walletConnected,
  onConnectWallet,
  walletAddress
}: WalletConnectionTutorialProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connection Tutorial
        </CardTitle>
        <CardDescription>
          Learn how to securely connect and manage your crypto wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Connection Status</h3>
              <div className="rounded-lg border p-4">
                {walletConnected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Wallet Connected</p>
                        <p className="text-sm text-muted-foreground">
                          {walletAddress}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={onComplete}>
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Wallet Not Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your wallet to access all features
                        </p>
                      </div>
                    </div>
                    <Button onClick={onConnectWallet}>
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Pro Tip: Always verify the connection request details and never share your private keys.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Supported Wallets</h3>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Browser Wallets</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>MetaMask</li>
                    <li>WalletConnect</li>
                    <li>Coinbase Wallet</li>
                    <li>Trust Wallet</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Hardware Wallets</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Ledger</li>
                    <li>Trezor</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Security Best Practices</h3>
              <div className="space-y-2">
                <div className="rounded-lg border p-4">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Always verify the website URL before connecting</li>
                    <li>Review transaction details carefully</li>
                    <li>Never share your private keys or seed phrase</li>
                    <li>Use hardware wallets for large holdings</li>
                    <li>Keep your wallet software updated</li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Features Unlocked with Wallet</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Portfolio tracking and analysis</li>
                  <li>Transaction history and insights</li>
                  <li>AI-powered investment recommendations</li>
                  <li>Custom alerts and notifications</li>
                  <li>Cross-chain asset management</li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>

        {!walletConnected && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onConnectWallet} className="flex items-center gap-2">
              Connect Wallet
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 