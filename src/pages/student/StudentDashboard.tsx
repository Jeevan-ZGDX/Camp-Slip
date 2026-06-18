import { useStore } from '../../store/useStore';
import { getStatusColor, getStatusLabel, getOutpassTypeLabel, getOutpassTypeColor, formatDate, getApprovalProgress } from '../../utils/helpers';
import { FileText, CheckCircle, XCircle, Clock, ArrowRight, QrCode, AlertTriangle, Plus, ChevronRight } from 'lucide-react';

export default function StudentDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { currentUser, outpasses } = useStore();
  if (!currentUser) return null;

  const myPasses = outpasses.filter((o) => o.studentId === currentUser.id);
  const pending = myPasses.filter((o) => o.status.startsWith('pending'));
  const approved = myPasses.filter((o) => o.status === 'approved');
  const rejected = myPasses.filter((o) => o.status === 'rejected');
  const recent = myPasses.slice(0, 4);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-primary-200 text-xs font-medium">Welcome back 👋</p>
          <h2 className="text-xl font-bold mt-1">{currentUser.name}</h2>
          <p className="text-primary-200 text-xs mt-1.5">
            {currentUser.studentId} · {currentUser.department} · Yr {currentUser.year}
            {currentUser.studentType === 'hostel' && ` · ${currentUser.hostelBlock}`}
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onNavigate('new-request')}
              className="bg-white text-primary-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-50 active:bg-primary-100 flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
            {approved.length > 0 && (
              <button
                onClick={() => onNavigate('my-passes')}
                className="bg-white/15 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/25 active:bg-white/30 flex items-center gap-1.5 backdrop-blur-sm"
              >
                <QrCode className="w-4 h-4" />
                QR Pass
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stat Pills - Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scroll-snap-x -mx-1 px-1">
        <StatPill label="Total" value={myPasses.length} icon={<FileText className="w-4 h-4" />} color="blue" />
        <StatPill label="Pending" value={pending.length} icon={<Clock className="w-4 h-4" />} color="amber" />
        <StatPill label="Approved" value={approved.length} icon={<CheckCircle className="w-4 h-4" />} color="emerald" />
        <StatPill label="Rejected" value={rejected.length} icon={<XCircle className="w-4 h-4" />} color="red" />
      </div>

      {/* Active Pass Alert */}
      {approved.length > 0 && (
        <button
          onClick={() => onNavigate('my-passes')}
          className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 active:bg-emerald-100 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">QR Pass Ready! 🎉</p>
            <p className="text-xs text-emerald-600 mt-0.5">{approved.length} approved pass{approved.length > 1 ? 'es' : ''} available</p>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>
      )}

      {/* Pending Alert */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{pending.length} Pending Approval{pending.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-600 mt-0.5">Awaiting review from approvers</p>
          </div>
        </div>
      )}

      {/* Workflow Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Approval Chain</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {['You', 'Faculty', 'HOD', ...(currentUser.studentType === 'hostel' ? ['Warden'] : []), 'QR'].map((step, idx, arr) => (
            <div key={step} className="flex items-center gap-1 shrink-0">
              <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${
                idx === 0 ? 'bg-primary-100 text-primary-700' :
                idx === arr.length - 1 ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {step}
              </div>
              {idx < arr.length - 1 && <span className="text-gray-300 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Recent Requests</h3>
          <button
            onClick={() => onNavigate('my-passes')}
            className="text-xs text-primary-600 font-bold flex items-center gap-0.5 active:text-primary-700"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No requests yet</p>
            <button
              onClick={() => onNavigate('new-request')}
              className="mt-2 text-primary-600 text-xs font-bold"
            >
              Create one now →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((pass) => (
              <button
                key={pass.id}
                onClick={() => onNavigate('my-passes')}
                className="w-full px-4 py-3.5 flex items-start gap-3 active:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  pass.status === 'approved' ? 'bg-emerald-50' :
                  pass.status === 'rejected' ? 'bg-red-50' :
                  pass.status === 'used' ? 'bg-blue-50' :
                  'bg-amber-50'
                }`}>
                  {pass.status === 'approved' ? <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> :
                   pass.status === 'rejected' ? <XCircle className="w-4.5 h-4.5 text-red-500" /> :
                   pass.status === 'used' ? <QrCode className="w-4.5 h-4.5 text-blue-500" /> :
                   <Clock className="w-4.5 h-4.5 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[10px] text-gray-400">{pass.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getOutpassTypeColor(pass.outpassType)}`}>
                      {getOutpassTypeLabel(pass.outpassType)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{pass.reason}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(pass.departureTime)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusColor(pass.status)}`}>
                    {getStatusLabel(pass.status)}
                  </span>
                  {pass.status !== 'rejected' && pass.status !== 'used' && (
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-2 ml-auto overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${getApprovalProgress(pass.status, pass.studentType)}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} rounded-2xl px-4 py-3 min-w-[100px] shrink-0 scroll-snap-start`}>
      <div className={`${c.icon} mb-1.5`}>{icon}</div>
      <p className={`text-2xl font-extrabold ${c.text}`}>{value}</p>
      <p className={`text-[10px] font-semibold ${c.text} opacity-70 mt-0.5`}>{label}</p>
    </div>
  );
}
