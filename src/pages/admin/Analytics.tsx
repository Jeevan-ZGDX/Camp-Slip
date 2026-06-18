import { useStore } from '../../store/useStore';
import { getOutpassTypeLabel } from '../../utils/helpers';
import { TrendingUp, Activity, Users, Clock, ArrowUp, ArrowDown } from 'lucide-react';

export default function Analytics() {
  const { outpasses, movementLogs } = useStore();

  const totalRequests = outpasses.length;
  const approved = outpasses.filter((o) => o.status === 'approved' || o.status === 'used').length;
  const rejected = outpasses.filter((o) => o.status === 'rejected').length;
  const pending = outpasses.filter((o) => o.status.startsWith('pending')).length;
  const hostelStudents = outpasses.filter((o) => o.studentType === 'hostel').length;
  const dayScholars = outpasses.filter((o) => o.studentType === 'day_scholar').length;

  const weeklyData = [
    { day: 'Mon', req: 5, app: 4 }, { day: 'Tue', req: 8, app: 6 },
    { day: 'Wed', req: 3, app: 2 }, { day: 'Thu', req: 7, app: 5 },
    { day: 'Fri', req: 12, app: 10 }, { day: 'Sat', req: 15, app: 12 },
    { day: 'Sun', req: 6, app: 5 },
  ];
  const maxReq = Math.max(...weeklyData.map((d) => d.req));

  const typeDistribution = [
    { type: 'regular', count: outpasses.filter((o) => o.outpassType === 'regular').length, color: '#3b82f6' },
    { type: 'medical', count: outpasses.filter((o) => o.outpassType === 'medical').length, color: '#8b5cf6' },
    { type: 'emergency', count: outpasses.filter((o) => o.outpassType === 'emergency').length, color: '#ef4444' },
    { type: 'event', count: outpasses.filter((o) => o.outpassType === 'event').length, color: '#14b8a6' },
    { type: 'weekend', count: outpasses.filter((o) => o.outpassType === 'weekend').length, color: '#6366f1' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Analytics & Reports</h2>
        <p className="text-xs text-gray-500">System-wide insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Avg. Approval', value: '4.2 hrs', change: '-12%', trend: 'down', icon: <Clock className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Approval Rate', value: `${totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0}%`, change: '+5%', trend: 'up', icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50' },
          { label: 'Outside Now', value: outpasses.filter((o) => o.exitTime && !o.entryTime).length.toString(), change: '', trend: '', icon: <Users className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50' },
          { label: 'Gate Scans', value: movementLogs.length.toString(), change: '+8', trend: 'up', icon: <Activity className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-200 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
              {kpi.change && (
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                  kpi.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              )}
            </div>
            <p className="text-xl font-extrabold text-gray-800">{kpi.value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Weekly Trend</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary-400" /> Requests</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> Approved</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {weeklyData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: '130px' }}>
                <div className="flex-1 bg-primary-200 rounded-t-md" style={{ height: `${(d.req / maxReq) * 100}%` }} />
                <div className="flex-1 bg-emerald-300 rounded-t-md" style={{ height: `${(d.app / maxReq) * 100}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Type Donut */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4">By Type</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              {(() => {
                let offset = 0;
                const total = typeDistribution.reduce((sum, t) => sum + t.count, 0) || 1;
                return typeDistribution.map((t) => {
                  const pct = (t.count / total) * 314;
                  const el = <circle key={t.type} cx="60" cy="60" r="50" fill="none" stroke={t.color} strokeWidth="12" strokeDasharray={`${pct} ${314 - pct}`} strokeDashoffset={-offset} />;
                  offset += pct;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-gray-800">{totalRequests}</span>
              <span className="text-[10px] text-gray-400">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {typeDistribution.map((t) => (
              <div key={t.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-gray-600">{getOutpassTypeLabel(t.type as any)}</span>
                </div>
                <span className="text-xs font-bold text-gray-800">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status & Student Type */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h4 className="text-xs font-bold text-gray-500 mb-3">Status</h4>
          <div className="space-y-2 text-center">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-2xl font-extrabold text-amber-600">{pending}</p>
              <p className="text-[10px] text-amber-700 font-medium">Pending</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <p className="text-lg font-extrabold text-emerald-600">{approved}</p>
                <p className="text-[10px] text-emerald-700 font-medium">Approved</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2.5">
                <p className="text-lg font-extrabold text-red-600">{rejected}</p>
                <p className="text-[10px] text-red-700 font-medium">Rejected</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h4 className="text-xs font-bold text-gray-500 mb-3">Student Type</h4>
          <div className="space-y-2">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{hostelStudents}</p>
              <p className="text-[10px] text-blue-700 font-medium">Hostel</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{dayScholars}</p>
              <p className="text-[10px] text-amber-700 font-medium">Day Scholar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Peak Request Hours</h3>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 24 }).map((_, hour) => {
            const intensity = [0.1, 0.05, 0.02, 0.02, 0.05, 0.15, 0.3, 0.5, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.5, 0.7, 0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08][hour];
            return <div key={hour} className="h-6 rounded" style={{ backgroundColor: `rgba(59,130,246,${intensity})` }} />;
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
        </div>
      </div>
    </div>
  );
}
