'use client';

import { useEffect, useState } from 'react';
import AdminDashboardPage from '@/components/dashboard/adminDashboard';
import ClientDashboardPage from '@/components/dashboard/clientDashboard';
import { getStoredUser, type AuthUserSummary } from '@/lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
  }, []);

  if (!ready) {
    return (
        <div className="flex h-[40vh] items-center justify-center text-gray-500">
          Loading…
        </div>
    );
  }

  if (user?.role === 'client') {
    return <ClientDashboardPage />;
  }

  return <AdminDashboardPage />;
}