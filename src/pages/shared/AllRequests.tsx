import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getStatusColor, getStatusLabel, getOutpassTypeLabel, getOutpassTypeColor, formatDateTime, getStudentTypeLabel } from '../../utils/helpers';
import { Search, FileText, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function AllRequests({ showOnlyHistory }: { showOnlyHistory?: boolean }) {
  const { currentUser, outpasses } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  let requests = outpasses;
  if (showOnlyHistory && (currentUser.role === 'faculty' || currentUser.role === 'hod' || currentUser.role === 'warden')) {
    requests = outpasses.filter((o) => {
      const a = currentUser.role === 'faculty' ? o.facultyApproval : currentUser.role === 'hod' ? o.hodApproval : o.wardenApproval;
      return a !== undefined;
    });
  }

  const filtered = requests.filter((o) => {
    const matchSearch = o.studentName.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || o.studentRollNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter || (statusFilter === 'pending' && o.status.startsWith('pending'));
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">{showOnlyHistory ? 'Approval History' : 'All Requests'}</h2>
        <p className="text-xs text-gray-500">{filtered.length} requests</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, roll no..."
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="used">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No requests found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{req.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getOutpassTypeColor(req.outpassType)}`}>
                        {getOutpassTypeLabel(req.outpassType)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{req.studentName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{req.studentRollNo} · {req.studentDept} · {getStudentTypeLabel(req.studentType)}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {req.destination}</span>
                      <span>·</span>
                      <span>{formatDateTime(req.departureTime)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-300 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[10px] text-gray-400">Reason</span>
                        <p className="text-gray-800 font-medium text-sm">{req.reason}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400">Return</span>
                        <p className="text-gray-800 font-medium text-sm">{formatDateTime(req.returnTime)}</p>
                      </div>
                      {req.hostelBlock && (
                        <div>
                          <span className="text-[10px] text-gray-400">Hostel</span>
                          <p className="text-gray-800 font-medium text-sm">{req.hostelBlock} / {req.roomNumber}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-gray-400">Parent</span>
                        <p className="text-gray-800 font-medium text-sm">{req.parentPhone}</p>
                      </div>
                    </div>

                    {/* Approvals */}
                    {(req.facultyApproval || req.hodApproval || req.wardenApproval) && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approval Chain</p>
                        {req.facultyApproval && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${req.facultyApproval.action === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="text-gray-600">Faculty: {req.facultyApproval.approverName} — <span className="font-medium">{req.facultyApproval.action}</span></span>
                          </div>
                        )}
                        {req.hodApproval && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${req.hodApproval.action === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="text-gray-600">HOD: {req.hodApproval.approverName} — <span className="font-medium">{req.hodApproval.action}</span></span>
                          </div>
                        )}
                        {req.wardenApproval && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${req.wardenApproval.action === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="text-gray-600">Warden: {req.wardenApproval.approverName} — <span className="font-medium">{req.wardenApproval.action}</span></span>
                          </div>
                        )}
                      </div>
                    )}

                    {req.exitTime && (
                      <div className="text-xs">
                        <span className="text-gray-400">Exit: </span>
                        <span className="font-medium text-gray-700">{formatDateTime(req.exitTime)}</span>
                        {req.entryTime && (
                          <><span className="text-gray-400"> · Entry: </span><span className="font-medium text-gray-700">{formatDateTime(req.entryTime)}</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
