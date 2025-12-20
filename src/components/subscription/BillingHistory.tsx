import { prisma } from '@/db/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BillingHistoryProps {
  userId: string;
}

export async function BillingHistory({ userId }: BillingHistoryProps) {
  // Fetch recent credit transactions
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'MONTHLY':
        return <Badge variant="success">Monthly Credit</Badge>;
      case 'PACK':
        return <Badge variant="info">Credit Pack</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        <p className="mt-4 text-center text-copy-muted">No transactions yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white">Transaction History</h3>

      <div className="mt-4 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-copy-muted">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 pr-0 text-right font-medium">Credits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="text-sm">
                <td className="py-3 text-copy">{formatDate(transaction.createdAt)}</td>
                <td className="py-3">{getTransactionTypeBadge(transaction.type)}</td>
                <td className="py-3 text-copy">{transaction.description || '-'}</td>
                <td className="py-3 pr-0 text-right font-medium">
                  <span className={transaction.amount >= 0 ? 'text-accent' : 'text-red-400'}>
                    {transaction.amount >= 0 ? '+' : ''}
                    {transaction.amount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
