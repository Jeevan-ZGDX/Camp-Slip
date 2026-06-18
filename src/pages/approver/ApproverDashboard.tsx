import { useStore } from '../../store/useStore';
import { getOutpassTypeColor, getOutpassTypeLabel, formatDate } from '../../utils/helpers';
import { CheckSquare, Clock, CheckCircle, XCircle, Users, AlertTriangle, ChevronRight } from 'lucide-react';

export default function ApproverDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { currentUser, outpasses } = useStore();
  if (!currentUser) return null;

  const role = currentUser.role;
  const pendingStatus = role === 'faculty' ? 'pending_faculty' : role === 'hod' ? 'pending_hod' : 'pending_warden';
  const pending = outpasses.filter((o) => o.status === pendingStatus);
  const approved = outpasses.filter((o) => {
    const a = role === 'faculty' ? o.facultyApproval : role === 'hod' ? o.hodApproval : o.wardenApproval;
    return a?.action === 'approved';
  });
  const rejected = outpasses.filter((o) => {
    const a = role === 'faculty' ? o.facultyApproval : role === 'hod' ? o.hodApproval : o.wardenApproval;
    return a?.action === 'rejected';
  });
  const emergency = pending.filter((o) => o.outpassType === 'emergency');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <p className="text-primary-200 text-xs">Welcome back 👋</p>
          <h2 className="text-xl font-bold mt-1">{currentUser.name}</h2>
          <p className="text-primary-200 text-xs mt-1">{currentUser.department} · {role.toUpperCase()}</p>
          {pending.length > 0 && (
            <button
              onClick={() => onNavigate('approvals')}
              className="mt-3 bg-white text-primary-700 px-4 py-2.5 rounded-xl text-xs font-bold active:bg-primary-50 flex items-center gap-1.5 shadow-lg"
            >
              <CheckSquare className="w-4 h-4" />
              {pending.length} Pending Review{pending.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{pending.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Pending</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{approved.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Approved</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{rejected.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Emergency */}
      {emergency.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-red-800">Emergency Requests</p>
          </div>
          {emergency.map((req) => (
            <button
              key={req.id}
              onClick={() => onNavigate('approvals')}
              className="w-full bg-white rounded-xl p-3 border border-red-100 mb-2 last:mb-0 flex items-center justify-between active:bg-red-50 text-left"
            >
              <div>
                <p className="text-sm font-bold text-gray-800">{req.studentName}</p>
                <p className="text-xs text-gray-500">{req.reason.substring(0, 40)}...</p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Pending Requests */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Pending Requests</h3>
          {pending.length > 0 && (
            <button onClick={() => onNavigate('approvals')} className="text-xs text-primary-600 font-bold">
              View All →
            </button>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pending.slice(0, 5).map((req) => (
              <button
                key={req.id}
                onClick={() => onNavigate('approvals')}
                className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{req.studentName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono">{req.studentRollNo}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getOutpassTypeColor(req.outpassType)}`}>
                      {getOutpassTypeLabel(req.outpassType)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400">{formatDate(req.createdAt)}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
