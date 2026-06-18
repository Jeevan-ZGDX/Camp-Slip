import { useStore } from '../../store/useStore';
import { formatDateTime } from '../../utils/helpers';
import { Clock, LogIn, LogOut as LogOutIcon, Search } from 'lucide-react';
import { useState } from 'react';

export default function MovementLog() {
  const { movementLogs } = useStore();
  const [search, setSearch] = useState('');

  const filtered = movementLogs.filter((log) =>
    log.studentName.toLowerCase().includes(search.toLowerCase()) ||
    log.passId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Movement Log</h2>
        <p className="text-xs text-gray-500">{movementLogs.length} records · Campus gate audit</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 mb-4">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student or pass ID..."
          className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No movement logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                log.action === 'exit' ? 'bg-red-50' : 'bg-emerald-50'
              }`}>
                {log.action === 'exit' ? <LogOutIcon className="w-5 h-5 text-red-500" /> : <LogIn className="w-5 h-5 text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{log.studentName}</p>
                <p className="text-[11px] text-gray-500">{log.passId} · {log.gateNumber}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Verified by {log.verifiedBy}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  log.action === 'exit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {log.action.toUpperCase()}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
