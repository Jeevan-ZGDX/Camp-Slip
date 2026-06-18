import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getRoleIcon, getRoleLabel } from '../../utils/helpers';
import { Search, Mail, Phone } from 'lucide-react';

export default function UsersPage() {
  const { users } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter((u) => {
    const match = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const role = roleFilter === 'all' || u.role === roleFilter;
    return match && role;
  });

  const roles = [
    { id: 'all', label: 'All', count: users.length },
    { id: 'student', label: 'Students', count: users.filter((u) => u.role === 'student').length },
    { id: 'faculty', label: 'Faculty', count: users.filter((u) => u.role === 'faculty').length },
    { id: 'admin', label: 'Admin', count: users.filter((u) => u.role === 'admin').length },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Users</h2>
        <p className="text-xs text-gray-500">{users.length} registered</p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scroll-snap-x -mx-1 px-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${
                roleFilter === r.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {r.label} ({r.count})
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="space-y-2">
        {filtered.map((user) => (
          <div key={user.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center text-2xl shrink-0">
              {getRoleIcon(user.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-[11px] text-primary-600 font-medium">{getRoleLabel(user.role)}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5 truncate"><Mail className="w-3 h-3" /> {user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                  <Phone className="w-3 h-3" /> {user.phone}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
              </span>
              <p className="font-mono text-[10px] text-gray-300 mt-0.5">{user.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
