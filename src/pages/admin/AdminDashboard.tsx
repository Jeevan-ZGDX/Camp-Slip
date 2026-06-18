import { useStore } from '../../store/useStore';
import { getOutpassTypeLabel } from '../../utils/helpers';
import {
  Users, FileText, CheckCircle, XCircle, Clock,
  TrendingUp, Shield, Activity, MapPin, ChevronRight
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { outpasses, users } = useStore();

  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalRequests = outpasses.length;
  const pending = outpasses.filter((o) => o.status.startsWith('pending')).length;
  const approved = outpasses.filter((o) => o.status === 'approved' || o.status === 'used').length;
  const rejected = outpasses.filter((o) => o.status === 'rejected').length;
  const activeOutside = outpasses.filter((o) => o.exitTime && !o.entryTime && o.status === 'approved').length;
  const approvalRate = totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-xs text-gray-500">System overview</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
          <Activity className="w-3 h-3" /> Online
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Students', value: totalStudents, icon: <Users className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50' },
          { label: 'Requests', value: totalRequests, icon: <FileText className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50' },
          { label: 'Pending', value: pending, icon: <Clock className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50' },
          { label: 'Approved', value: approved, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Rejected', value: rejected, icon: <XCircle className="w-4 h-4" />, color: 'text-red-500 bg-red-50' },
          { label: 'Outside', value: activeOutside, icon: <MapPin className="w-4 h-4" />, color: 'text-orange-500 bg-orange-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
            <p className="text-xl font-extrabold text-gray-800">{stat.value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Approval Rate */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Approval Rate</h3>
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> {approvalRate}%
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
          <div className="bg-emerald-400 rounded-l-full transition-all" style={{ width: `${approvalRate}%` }} />
          <div className="bg-red-300 flex-1" />
          <div className="bg-gray-300 rounded-r-full" style={{ width: `${100 - approvalRate - Math.round((rejected / totalRequests) * 100 || 0)}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded bg-emerald-400" /> Approved</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded bg-red-300" /> Rejected</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded bg-gray-300" /> Pending</span>
        </div>
      </div>

      {/* Request Types */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">By Type</h3>
        <div className="space-y-2.5">
          {[
            { type: 'regular', color: 'bg-blue-500' },
            { type: 'medical', color: 'bg-purple-500' },
            { type: 'emergency', color: 'bg-red-500' },
            { type: 'event', color: 'bg-teal-500' },
            { type: 'weekend', color: 'bg-indigo-500' },
          ].map((item) => {
            const count = outpasses.filter((o) => o.outpassType === item.type).length;
            const maxCount = Math.max(...['regular', 'medical', 'emergency', 'event', 'weekend'].map((t) => outpasses.filter((o) => o.outpassType === t).length), 1);
            return (
              <div key={item.type} className="flex items-center gap-2.5">
                <span className="text-xs text-gray-600 w-16 shrink-0">{getOutpassTypeLabel(item.type as any)}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        {[
          { label: 'Analytics & Reports', icon: <Activity className="w-5 h-5" />, tab: 'analytics', color: 'text-blue-600 bg-blue-50' },
          { label: 'All Requests', icon: <FileText className="w-5 h-5" />, tab: 'all-requests', color: 'text-purple-600 bg-purple-50' },
          { label: 'User Management', icon: <Users className="w-5 h-5" />, tab: 'users', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Movement Log', icon: <Clock className="w-5 h-5" />, tab: 'movement-log', color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 active:bg-gray-50 text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              {item.icon}
            </div>
            <span className="flex-1 text-sm font-bold text-gray-800">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
      </div>

      {/* System Health */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">System Health</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'API', value: 'Online' },
            { label: 'Database', value: 'PostgreSQL' },
            { label: 'Auth', value: 'JWT + RBAC' },
            { label: 'Push', value: 'FCM Active' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-400">{item.label}</p>
              <p className="text-xs font-bold text-emerald-400">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
