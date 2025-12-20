'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable, SkeletonStats } from '@/components/ui/Skeleton';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';

interface Client {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  joinedAt: string;
  coursesOwned: number;
  sessionsBooked: number;
  coachingRequests: number;
  lastActivity: string;
  courses: { id: string; title: string }[];
}

interface Stats {
  totalClients: number;
  activeThisMonth: number;
  totalCoursePurchases: number;
  totalSessionBookings: number;
  totalCoachingRequests: number;
}

export default function CoachClientsPage() {
  const { error } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data.clients);
      setStats(data.stats);
    } catch (err) {
      error('Error', 'Failed to load clients data');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  });

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActivityStatus = (lastActivity: string) => {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 7) return { label: 'Active', variant: 'success' as const };
    if (daysSince < 30) return { label: 'Recent', variant: 'info' as const };
    return { label: 'Inactive', variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Clients</h1>
          <p className="text-gray-400">Manage and track your students</p>
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Clients</h1>
        <p className="text-gray-400">Manage and track your students</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <div className="text-sm text-gray-400 mb-1">Total Clients</div>
            <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Active This Month</div>
            <div className="text-3xl font-bold text-green-400">{stats.activeThisMonth}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Course Sales</div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalCoursePurchases}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Session Bookings</div>
            <div className="text-3xl font-bold text-purple-400">{stats.totalSessionBookings}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Coaching Requests</div>
            <div className="text-3xl font-bold text-orange-400">{stats.totalCoachingRequests}</div>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* Clients Table */}
      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={EmptyStateIcons.students}
            title="No clients yet"
            description="When athletes purchase your courses, book sessions, or request coaching, they'll appear here."
          />
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-400">No clients match your search.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Coaching
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredClients.map((client) => {
                  const activity = getActivityStatus(client.lastActivity);
                  return (
                    <tr key={client.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
                            {getInitials(client.firstName, client.lastName, client.email)}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {client.firstName || client.lastName
                                ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()
                                : 'Unnamed'}
                            </div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={activity.variant}>{activity.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{client.coursesOwned}</div>
                        {client.courses.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate">
                            {client.courses.map((c) => c.title).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">{client.sessionsBooked}</td>
                      <td className="px-6 py-4 text-white">{client.coachingRequests}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(client.lastActivity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
