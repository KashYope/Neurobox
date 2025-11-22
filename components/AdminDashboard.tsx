import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ClipboardList, LogOut, UserPlus, Building2 } from 'lucide-react';
import { Button } from './Button';
import { Exercise, PartnerAccount } from '../types';
import { apiClient } from '../services/apiClient';
import { getExercises, moderateExercise } from '../services/dataService';
import { ModerationPanel } from './ModerationPanel';

export const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation(['common', 'partner', 'moderation']);
  const [accounts, setAccounts] = useState<PartnerAccount[]>([]);
  const [viewMode, setViewMode] = useState<'accounts' | 'moderation'>('accounts');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const users = await apiClient.fetchUsers();
        setAccounts(users);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchAccounts();
  }, []);

  // Dummy state for moderation panel props since we reuse it
  const [pendingExercises, setPendingExercises] = useState<Exercise[]>([]);
  const [reviewedExercises, setReviewedExercises] = useState<Exercise[]>([]);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'moderation') {
        const loadQueue = async () => {
            try {
                const response = await apiClient.fetchModerationQueue();
                setPendingExercises(response.queue);
                setReviewedExercises(response.recent);
                setModerationStatus(t('moderation:status.synced'));
            } catch (error) {
                // Fallback to local if server fails or auth fails (though admin should be auth'd)
                setModerationStatus(t('moderation:status.serverUnavailable'));
                const all = getExercises();
                const community = all.filter(ex => ex.isCommunitySubmitted);
                setPendingExercises(community.filter(ex => (ex.moderationStatus ?? 'approved') === 'pending'));
                setReviewedExercises(community.filter(ex => (ex.moderationStatus && ex.moderationStatus !== 'pending') || ex.moderatedAt));
            }
        };
        loadQueue();
    }
  }, [viewMode, t]);

  const handleUpdateStatus = async (id: string, status: 'active' | 'rejected') => {
    try {
      const updatedUser = await apiClient.updateUserStatus(id, status);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedUser : acc));
    } catch (error) {
      console.error('Failed to update user status', error);
    }
  };

  const handleLogout = async () => {
      await apiClient.logout();
      window.dispatchEvent(new CustomEvent('partner-session-change', { detail: null }));
      onBack();
  };

  const handleModerationDecision = (exercise: Exercise, status: 'approved' | 'rejected', notes?: string) => {
    const moderator = 'Admin';
    const targetId = exercise.serverId ?? exercise.id;
    moderateExercise(targetId, status, {
      moderator,
      notes,
      shouldDelete: status === 'rejected'
    });

    // Refresh local view
    setPendingExercises(prev => prev.filter(ex => ex.id !== exercise.id));
    setReviewedExercises(prev => [{
        ...exercise,
        moderationStatus: status,
        moderationNotes: notes,
        moderatedBy: moderator,
        moderatedAt: new Date().toISOString()
    }, ...prev]);
  };

  if (viewMode === 'moderation') {
      return (
          <ModerationPanel
            pendingExercises={pendingExercises}
            reviewedExercises={reviewedExercises}
            onApprove={(ex, notes) => handleModerationDecision(ex, 'approved', notes)}
            onReject={(ex, notes) => handleModerationDecision(ex, 'rejected', notes)}
            onBack={() => setViewMode('accounts')}
            statusNote={moderationStatus}
          />
      );
  }

  const pendingAccounts = accounts.filter(a => a.status === 'pending');
  const activeAccounts = accounts.filter(a => a.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">NeuroSooth</p>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" size="sm" onClick={() => setViewMode('moderation')}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Moderation Content
             </Button>
             <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Pending Accounts */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900">Pending Registrations ({pendingAccounts.length})</h2>
                </div>
            </div>

            {pendingAccounts.length === 0 ? (
                <p className="text-slate-500 italic">No pending account requests.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Organization</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingAccounts.map(acc => (
                                <tr key={acc.id}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{acc.organization}</td>
                                    <td className="px-4 py-3">{acc.contactName}</td>
                                    <td className="px-4 py-3">{acc.email}</td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => handleUpdateStatus(acc.id, 'rejected')}>
                                            Reject
                                        </Button>
                                        <Button size="sm" onClick={() => handleUpdateStatus(acc.id, 'active')}>
                                            Approve
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>

        {/* Active Accounts */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900">Active Partners ({activeAccounts.length})</h2>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeAccounts.map(acc => (
                    <div key={acc.id} className="p-4 border border-slate-100 rounded-xl hover:border-teal-200 transition-colors">
                        <h3 className="font-semibold text-slate-900">{acc.organization}</h3>
                        <p className="text-xs text-slate-500 mt-1">{acc.contactName}</p>
                        <p className="text-xs text-slate-400">{acc.email}</p>
                        {acc.role === 'admin' && <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">Admin</span>}
                    </div>
                ))}
            </div>
        </section>
      </main>
    </div>
  );
};
