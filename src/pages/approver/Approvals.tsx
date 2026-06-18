import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getOutpassTypeLabel, getOutpassTypeColor, getStudentTypeLabel, formatDateTime } from '../../utils/helpers';
import { CheckCircle, XCircle, MapPin, Calendar, Clock, User, MessageSquare, AlertTriangle, ChevronDown } from 'lucide-react';

export default function Approvals() {
  const { currentUser, outpasses, updateOutpassStatus } = useStore();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role as 'faculty' | 'hod' | 'warden';
  const pendingStatus = role === 'faculty' ? 'pending_faculty' : role === 'hod' ? 'pending_hod' : 'pending_warden';
  const pending = outpasses.filter((o) => o.status === pendingStatus);

  const handleApprove = (passId: string) => {
    updateOutpassStatus(passId, 'approved' as any, role, currentUser.id, currentUser.name, 'approved', remarks[passId] || 'Approved');
    setRemarks((p) => { const c = { ...p }; delete c[passId]; return c; });
    setExpandedId(null);
  };

  const handleReject = (passId: string) => {
    if (!remarks[passId]?.trim()) { alert('Please provide a rejection reason.'); return; }
    updateOutpassStatus(passId, 'rejected', role, currentUser.id, currentUser.name, 'rejected', remarks[passId]);
    setRemarks((p) => { const c = { ...p }; delete c[passId]; return c; });
    setExpandedId(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Pending Approvals</h2>
        <p className="text-xs text-gray-500">{pending.length} request{pending.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <CheckCircle className="w-14 h-14 text-emerald-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">All Clear! 🎉</p>
          <p className="text-xs text-gray-500 mt-1">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                req.outpassType === 'emergency' ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'
              }`}>
                {req.outpassType === 'emergency' && (
                  <div className="bg-red-50 px-4 py-2 flex items-center gap-2 border-b border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[10px] font-bold text-red-700 uppercase">Emergency</span>
                  </div>
                )}

                {/* Header - always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-gray-50"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-sm font-bold text-gray-800">{req.studentName}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getOutpassTypeColor(req.outpassType)}`}>
                        {getOutpassTypeLabel(req.outpassType)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{req.studentRollNo} · {req.studentDept} · {getStudentTypeLabel(req.studentType)}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {req.destination}</span>
                      <span>·</span>
                      <span>{formatDateTime(req.departureTime)}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-300 shrink-0 transition-transform mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in bg-gray-50/50">
                    {/* Details */}
                    <div className="space-y-2.5">
                      <Detail icon={<span className="text-xs">📝</span>} label="Reason" value={req.reason} />
                      <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Destination" value={req.destination} />
                      <Detail icon={<Calendar className="w-3.5 h-3.5" />} label="Departure" value={formatDateTime(req.departureTime)} />
                      <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Return" value={formatDateTime(req.returnTime)} />
                      {req.hostelBlock && <Detail icon={<span className="text-xs">🏠</span>} label="Hostel" value={`${req.hostelBlock} / ${req.roomNumber}`} />}
                      <Detail icon={<span className="text-xs">📞</span>} label="Parent" value={req.parentPhone} />
                    </div>

                    {/* Previous Approvals */}
                    {(req.facultyApproval || req.hodApproval) && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Previous Approvals</p>
                        {req.facultyApproval && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-gray-600">Faculty: {req.facultyApproval.approverName} — {req.facultyApproval.remarks || 'OK'}</span>
                          </div>
                        )}
                        {req.hodApproval && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-gray-600">HOD: {req.hodApproval.approverName} — {req.hodApproval.remarks || 'OK'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remarks */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Remarks
                      </label>
                      <textarea
                        value={remarks[req.id] || ''}
                        onChange={(e) => setRemarks((p) => ({ ...p, [req.id]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 resize-none transition-colors"
                        placeholder="Add comments (required for rejection)..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl text-sm font-bold active:bg-red-100 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold active:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </div>
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

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-[10px] text-gray-400 font-medium">{label}</span>
        <p className="text-gray-800 font-medium text-sm">{value}</p>
      </div>
    </div>
  );
}
