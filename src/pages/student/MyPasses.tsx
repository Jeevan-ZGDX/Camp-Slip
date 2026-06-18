import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../../store/useStore';
import { getStatusColor, getStatusLabel, getOutpassTypeLabel, getOutpassTypeColor, formatDateTime, getApprovalProgress } from '../../utils/helpers';
import { QrCode, Clock, MapPin, CheckCircle, XCircle, X, Shield, Calendar, User } from 'lucide-react';

export default function MyPasses() {
  const { currentUser, outpasses } = useStore();
  const [selectedPass, setSelectedPass] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  if (!currentUser) return null;

  const myPasses = outpasses.filter((o) => o.studentId === currentUser.id);
  const filtered = filter === 'all' ? myPasses : myPasses.filter((o) => {
    if (filter === 'pending') return o.status.startsWith('pending');
    if (filter === 'approved') return o.status === 'approved';
    if (filter === 'completed') return o.status === 'used';
    if (filter === 'rejected') return o.status === 'rejected';
    return true;
  });
  const selected = myPasses.find((p) => p.id === selectedPass);

  const filters = [
    { id: 'all', label: 'All', count: myPasses.length },
    { id: 'pending', label: 'Pending', count: myPasses.filter((o) => o.status.startsWith('pending')).length },
    { id: 'approved', label: 'Active', count: myPasses.filter((o) => o.status === 'approved').length },
    { id: 'completed', label: 'Done', count: myPasses.filter((o) => o.status === 'used').length },
    { id: 'rejected', label: 'Rejected', count: myPasses.filter((o) => o.status === 'rejected').length },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">My Passes</h2>
        <p className="text-xs text-gray-500">Track and manage your outpasses</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scroll-snap-x">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              filter === f.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 active:bg-gray-50'
            }`}
          >
            {f.label}
            <span className={`ml-1 ${filter === f.id ? 'text-primary-200' : 'text-gray-400'}`}>({f.count})</span>
          </button>
        ))}
      </div>

      {/* Pass cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No passes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pass) => (
            <button
              key={pass.id}
              onClick={() => setSelectedPass(pass.id)}
              className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-left active:bg-gray-50 active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{pass.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getOutpassTypeColor(pass.outpassType)}`}>
                      {getOutpassTypeLabel(pass.outpassType)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{pass.reason}</h4>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${getStatusColor(pass.status)}`}>
                  {getStatusLabel(pass.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {pass.destination}</span>
                <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {formatDateTime(pass.departureTime)}</span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pass.status === 'rejected' ? 'bg-red-400' :
                      pass.status === 'approved' || pass.status === 'used' ? 'bg-emerald-400' : 'bg-primary-500'
                    }`}
                    style={{ width: `${getApprovalProgress(pass.status, pass.studentType)}%` }}
                  />
                </div>
                {pass.status === 'approved' && pass.qrData && (
                  <QrCode className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-1 mt-2.5">
                <StepDot done label="You" />
                <Line done={!!pass.facultyApproval} />
                <StepDot done={pass.facultyApproval?.action === 'approved'} rejected={pass.facultyApproval?.action === 'rejected'} label="Faculty" />
                <Line done={!!pass.hodApproval} />
                <StepDot done={pass.hodApproval?.action === 'approved'} rejected={pass.hodApproval?.action === 'rejected'} label="HOD" />
                {pass.studentType === 'hostel' && (
                  <>
                    <Line done={!!pass.wardenApproval} />
                    <StepDot done={pass.wardenApproval?.action === 'approved'} rejected={pass.wardenApproval?.action === 'rejected'} label="Warden" />
                  </>
                )}
                <Line done={pass.status === 'approved' || pass.status === 'used'} />
                <StepDot done={pass.status === 'approved' || pass.status === 'used'} label="QR" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal - Bottom Sheet */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedPass(null)}>
          <div
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close */}
            <div className="px-5 py-2 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Pass Details</h3>
              <button onClick={() => setSelectedPass(null)} className="p-1.5 rounded-xl bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-4">
              {/* Status */}
              <div className="text-center">
                <span className={`text-sm px-4 py-1.5 rounded-full font-bold border ${getStatusColor(selected.status)}`}>
                  {getStatusLabel(selected.status)}
                </span>
                <p className="font-mono text-xs text-gray-400 mt-1.5">{selected.id}</p>
              </div>

              {/* QR Code */}
              {(selected.status === 'approved' || selected.status === 'used') && selected.qrData && (
                <div className="bg-gradient-to-b from-primary-50 to-white rounded-2xl p-5 text-center border border-primary-100">
                  <div className="inline-block p-3 bg-white rounded-2xl shadow-lg">
                    <QRCodeSVG value={selected.qrData} size={160} level="H" />
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-primary-600 font-medium mt-3">
                    <Shield className="w-3 h-3" /> Encrypted & Tamper-Resistant
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2.5">
                {[
                  { icon: <User className="w-3.5 h-3.5" />, label: 'Student', value: selected.studentName },
                  { icon: <span className="text-xs">🎓</span>, label: 'Roll No', value: selected.studentRollNo },
                  { icon: <span className="text-xs">🏛️</span>, label: 'Dept', value: selected.studentDept },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Destination', value: selected.destination },
                  { icon: <span className="text-xs">📝</span>, label: 'Reason', value: selected.reason },
                  { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Departure', value: formatDateTime(selected.departureTime) },
                  { icon: <Clock className="w-3.5 h-3.5" />, label: 'Return', value: formatDateTime(selected.returnTime) },
                  ...(selected.exitTime ? [{ icon: <span className="text-xs">🚶</span>, label: 'Exit', value: formatDateTime(selected.exitTime) }] : []),
                  ...(selected.entryTime ? [{ icon: <span className="text-xs">🏠</span>, label: 'Entry', value: formatDateTime(selected.entryTime) }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5 text-sm">
                    <span className="text-gray-400 mt-0.5 shrink-0">{item.icon}</span>
                    <div>
                      <span className="text-[10px] text-gray-400">{item.label}</span>
                      <p className="text-gray-800 font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeline</p>
                <div className="space-y-2">
                  <TimelineItem label="Submitted" time={formatDateTime(selected.createdAt)} status="done" />
                  {selected.facultyApproval && (
                    <TimelineItem label={`Faculty: ${selected.facultyApproval.approverName}`} time={formatDateTime(selected.facultyApproval.timestamp)} status={selected.facultyApproval.action === 'approved' ? 'done' : 'rejected'} remarks={selected.facultyApproval.remarks} />
                  )}
                  {selected.hodApproval && (
                    <TimelineItem label={`HOD: ${selected.hodApproval.approverName}`} time={formatDateTime(selected.hodApproval.timestamp)} status={selected.hodApproval.action === 'approved' ? 'done' : 'rejected'} remarks={selected.hodApproval.remarks} />
                  )}
                  {selected.wardenApproval && (
                    <TimelineItem label={`Warden: ${selected.wardenApproval.approverName}`} time={formatDateTime(selected.wardenApproval.timestamp)} status={selected.wardenApproval.action === 'approved' ? 'done' : 'rejected'} remarks={selected.wardenApproval.remarks} />
                  )}
                  {(selected.status === 'approved' || selected.status === 'used') && (
                    <TimelineItem label="QR Pass Generated" time="Auto-generated" status="done" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({ done, rejected, label }: { done?: boolean; rejected?: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        rejected ? 'bg-red-100' : done ? 'bg-emerald-100' : 'bg-gray-100'
      }`}>
        {rejected ? <XCircle className="w-2.5 h-2.5 text-red-500" /> :
         done ? <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> :
         <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
      </div>
      <span className="text-[9px] text-gray-400 font-medium">{label}</span>
    </div>
  );
}

function Line({ done }: { done: boolean }) {
  return <div className={`flex-1 h-0.5 min-w-[8px] mt-[-10px] ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />;
}

function TimelineItem({ label, time, status, remarks }: { label: string; time: string; status: 'done' | 'rejected'; remarks?: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
          status === 'done' ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {status === 'done' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
        </div>
        <div className="w-0.5 h-full bg-gray-100 min-h-[6px]" />
      </div>
      <div className="pb-2">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-500">{time}</p>
        {remarks && <p className="text-[11px] text-gray-500 italic mt-0.5">"{remarks}"</p>}
      </div>
    </div>
  );
}
