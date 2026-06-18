import { useStore } from '../../store/useStore';
import { formatDateTime } from '../../utils/helpers';
import { Shield, QrCode, LogIn, LogOut as LogOutIcon, Users, Clock, ChevronRight } from 'lucide-react';

export default function SecurityDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { outpasses, movementLogs } = useStore();

  const activeOutside = outpasses.filter((o) => o.exitTime && !o.entryTime && o.status === 'approved');
  const todayLogs = movementLogs.slice(0, 6);
  const approvedPasses = outpasses.filter((o) => o.status === 'approved' && !o.exitTime);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Security Personnel</p>
              <h2 className="text-lg font-bold">Gate Verification</h2>
            </div>
          </div>
          <button
            onClick={() => onNavigate('scanner')}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:bg-emerald-600 animate-pulse-glow"
          >
            <QrCode className="w-5 h-5" />
            Open QR Scanner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{activeOutside.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Outside</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <QrCode className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{approvedPasses.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Ready</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-gray-800">{todayLogs.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Scans</p>
        </div>
      </div>

      {/* Students Outside */}
      {activeOutside.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              Outside Campus
            </h3>
            <span className="text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">{activeOutside.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {activeOutside.map((o) => (
              <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <LogOutIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{o.studentName}</p>
                  <p className="text-[11px] text-gray-500">{o.studentRollNo} · Exit {o.exitTime ? formatDateTime(o.exitTime) : '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400">Return by</p>
                  <p className="text-[11px] font-semibold text-amber-700">{formatDateTime(o.returnTime)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Recent Activity</h3>
          <button onClick={() => onNavigate('movement-log')} className="text-xs text-primary-600 font-bold flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {todayLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No activity recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  log.action === 'exit' ? 'bg-red-50' : 'bg-emerald-50'
                }`}>
                  {log.action === 'exit' ? <LogOutIcon className="w-4 h-4 text-red-500" /> : <LogIn className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{log.studentName}</p>
                  <p className="text-[11px] text-gray-500">{log.gateNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    log.action === 'exit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {log.action.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
