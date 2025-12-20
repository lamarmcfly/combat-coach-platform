'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonStats, SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';

interface Stats {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  monthGrowth: number;
  pendingPayout: number;
  totalCoursesSold: number;
  totalSessionsBooked: number;
  platformFee: number;
}

interface MonthlyRevenue {
  month: string;
  courses: number;
  sessions: number;
  total: number;
}

interface Transaction {
  id: string;
  type: 'course' | 'session';
  title: string;
  customer: string;
  amount: number;
  date: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  payoutDate: string | null;
}

export default function CoachEarningsPage() {
  const { error } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<MonthlyRevenue[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/earnings');
      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }
      const data = await response.json();
      setStats(data.stats);
      setRevenueByMonth(data.revenueByMonth);
      setTransactions(data.recentTransactions);
      setPayouts(data.payouts);
    } catch (err) {
      error('Error', 'Failed to load earnings data');
      console.error('Error fetching earnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.total), 1);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
          <p className="text-gray-400">Track your revenue and payouts</p>
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  const hasEarnings = stats && stats.totalRevenue > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
        <p className="text-gray-400">Track your revenue and payouts</p>
      </div>

      {!hasEarnings ? (
        <Card>
          <EmptyState
            icon={EmptyStateIcons.earnings}
            title="No earnings yet"
            description="When athletes purchase your courses or book sessions, your earnings will appear here."
          />
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-400 mb-1">This Month</div>
              <div className="text-3xl font-bold text-green-400">{formatCurrency(stats.thisMonthRevenue)}</div>
              <div className="flex items-center gap-1 mt-1">
                {stats.monthGrowth >= 0 ? (
                  <span className="text-xs text-green-400">+{stats.monthGrowth}%</span>
                ) : (
                  <span className="text-xs text-red-400">{stats.monthGrowth}%</span>
                )}
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-400 mb-1">Pending Payout</div>
              <div className="text-3xl font-bold text-blue-400">{formatCurrency(stats.pendingPayout)}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.platformFee}% platform fee</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-400 mb-1">Total Sales</div>
              <div className="text-3xl font-bold text-purple-400">
                {stats.totalCoursesSold + stats.totalSessionsBooked}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.totalCoursesSold} courses, {stats.totalSessionsBooked} sessions
              </div>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Revenue (Last 6 Months)</h2>
            <div className="h-64 flex items-end gap-4">
              {revenueByMonth.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300"
                      style={{
                        height: `${(month.courses / maxRevenue) * 100}%`,
                        minHeight: month.courses > 0 ? '4px' : '0',
                      }}
                      title={`Courses: ${formatCurrency(month.courses)}`}
                    />
                    <div
                      className="w-full bg-purple-500 rounded-b transition-all duration-300"
                      style={{
                        height: `${(month.sessions / maxRevenue) * 100}%`,
                        minHeight: month.sessions > 0 ? '4px' : '0',
                      }}
                      title={`Sessions: ${formatCurrency(month.sessions)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{month.month}</div>
                  <div className="text-xs font-medium text-white">{formatCurrency(month.total)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-gray-400">Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-xs text-gray-400">Sessions</span>
              </div>
            </div>
          </Card>

          {/* Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {transactions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No transactions yet
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'course' ? 'bg-blue-900 text-blue-400' : 'bg-purple-900 text-purple-400'
                          }`}
                        >
                          {tx.type === 'course' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{tx.title}</div>
                          <div className="text-xs text-gray-500">{tx.customer}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-400">{formatCurrency(tx.amount / 100)}</div>
                        <div className="text-xs text-gray-500">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Payout History */}
            <Card className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">Payout History</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {payouts.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No payouts yet. Your first payout will be processed at the end of the month.
                  </div>
                ) : (
                  payouts.map((payout) => (
                    <div key={payout.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{formatCurrency(payout.amount)}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            payout.status === 'PAID'
                              ? 'success'
                              : payout.status === 'IN_TRANSIT'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {payout.status}
                        </Badge>
                        {payout.payoutDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(payout.payoutDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
