import { useContractAnalysis } from '@/hooks/use-contract-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icons } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';

export function ContractOverview() {
  // Provide required address and network for useContractAnalysis
  const address = "0x0000000000000000000000000000000000000000"; // TODO: Replace with actual contract address
  const network = "ethereum";
  const { data: analysis, isLoading, error } = useContractAnalysis(address, network);

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contract Security</CardTitle>
          <Icons.contract className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Error loading contract data</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contract Security</CardTitle>
          <Icons.contract className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="mt-4 h-4 w-[60px]" />
        </CardContent>
      </Card>
    );
  }

  // Update property access to match ContractAnalyzerResponse
  const securityScore = analysis?.data?.securityScore || 0;
  const vulnerabilities = analysis?.data?.analysis?.findings?.length || 0;
  const Icon = securityScore > 80 ? Icons.shield : securityScore > 50 ? Icons.alertCircle : Icons.alertTriangle;
  const color = securityScore > 80 ? 'text-green-500' : securityScore > 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Contract Security</CardTitle>
        <Icons.contract className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{securityScore}/100</div>
        <div className="mt-1 flex items-center space-x-2">
          <span className={color}>
            <Icon className="h-4 w-4" />
          </span>
          <p className={`text-xs ${color}`}>
            {vulnerabilities} vulnerabilities found
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 