import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { OutpassType, OutpassRequest } from '../../types';
import { generatePassId, getOutpassTypeLabel } from '../../utils/helpers';
import { MapPin, Calendar, Clock, MessageSquare, Send, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const outpassTypes: { value: OutpassType; label: string; desc: string; icon: string }[] = [
  { value: 'regular', label: 'Regular', desc: 'Personal visit, family', icon: '📋' },
  { value: 'medical', label: 'Medical', desc: 'Doctor appointment', icon: '🏥' },
  { value: 'emergency', label: 'Emergency', desc: 'Urgent situation', icon: '🚨' },
  { value: 'event', label: 'Event', desc: 'Conference, workshop', icon: '🎪' },
  { value: 'weekend', label: 'Weekend', desc: 'Weekend home visit', icon: '🏡' },
];

export default function NewRequest({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { currentUser, createOutpass } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    outpassType: '' as OutpassType | '',
    reason: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 1 && !form.outpassType) newErrors.outpassType = 'Please select a type';
    if (s === 2) {
      if (!form.reason.trim()) newErrors.reason = 'Required';
      if (form.reason.trim().length > 0 && form.reason.trim().length < 10) newErrors.reason = 'Min 10 characters';
      if (!form.destination.trim()) newErrors.destination = 'Required';
    }
    if (s === 3) {
      if (!form.departureDate) newErrors.departureDate = 'Required';
      if (!form.departureTime) newErrors.departureTime = 'Required';
      if (!form.returnDate) newErrors.returnDate = 'Required';
      if (!form.returnTime) newErrors.returnTime = 'Required';
      if (form.departureDate && form.returnDate && form.departureTime && form.returnTime) {
        if (new Date(`${form.returnDate}T${form.returnTime}`) <= new Date(`${form.departureDate}T${form.departureTime}`)) {
          newErrors.returnDate = 'Must be after departure';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const passId = generatePassId();
    const outpass: OutpassRequest = {
      id: passId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentDept: currentUser.department || '',
      studentType: currentUser.studentType || 'day_scholar',
      studentYear: currentUser.year || 1,
      studentRollNo: currentUser.studentId || '',
      hostelBlock: currentUser.hostelBlock,
      roomNumber: currentUser.roomNumber,
      outpassType: form.outpassType as OutpassType,
      reason: form.reason,
      destination: form.destination,
      departureTime: `${form.departureDate}T${form.departureTime}:00`,
      returnTime: `${form.returnDate}T${form.returnTime}:00`,
      status: 'pending_faculty',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentNotified: false,
      parentPhone: currentUser.parentPhone || '',
    };

    createOutpass(outpass);
    setSubmittedId(passId);
    setSubmitted(true);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Submitted! 🎉</h2>
        <p className="text-gray-500 text-sm mb-5 px-4">Your request has been sent to your Faculty Advisor for approval.</p>
        <div className="bg-gray-50 rounded-2xl p-4 mx-4 mb-6">
          <p className="text-xs text-gray-400">Request ID</p>
          <p className="text-xl font-mono font-bold text-primary-600 mt-1">{submittedId}</p>
        </div>
        <div className="flex gap-3 justify-center px-4">
          <button
            onClick={() => onNavigate('my-passes')}
            className="flex-1 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold active:bg-primary-700"
          >
            View My Passes
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold active:bg-gray-200"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => step > 1 ? setStep(step - 1) : onNavigate('dashboard')} className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">New Outpass Request</h2>
          <p className="text-xs text-gray-500">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6 px-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${
            s <= step ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 px-1">What type of outpass?</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {outpassTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setForm({ ...form, outpassType: type.value })}
                className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                  form.outpassType === type.value
                    ? 'border-primary-400 bg-primary-50 shadow-md shadow-primary-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <p className="text-sm font-bold text-gray-800 mt-2">{type.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
          {errors.outpassType && (
            <p className="text-xs text-red-500 flex items-center gap-1 px-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.outpassType}
            </p>
          )}
          <button
            onClick={nextStep}
            disabled={!form.outpassType}
            className="w-full py-3.5 bg-primary-600 text-white rounded-2xl text-sm font-bold mt-4 active:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 px-1">Where are you going?</h3>
          <div>
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2 px-1">
              <MessageSquare className="w-3.5 h-3.5" /> Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400 focus:ring-0 resize-none transition-colors"
              placeholder="Describe your reason for outpass..."
            />
            {errors.reason && <p className="text-xs text-red-500 mt-1 px-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.reason}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2 px-1">
              <MapPin className="w-3.5 h-3.5" /> Destination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-400 focus:ring-0 transition-colors"
              placeholder="City, Place name..."
            />
            {errors.destination && <p className="text-xs text-red-500 mt-1 px-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.destination}</p>}
          </div>
          <button
            onClick={nextStep}
            className="w-full py-3.5 bg-primary-600 text-white rounded-2xl text-sm font-bold active:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 px-1">When do you leave and return?</h3>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5" /> Departure
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 transition-colors"
                  />
                  {errors.departureDate && <p className="text-[10px] text-red-500 mt-1">{errors.departureDate}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={form.departureTime}
                      onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 transition-colors"
                    />
                  </div>
                  {errors.departureTime && <p className="text-[10px] text-red-500 mt-1">{errors.departureTime}</p>}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5" /> Return
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 transition-colors"
                  />
                  {errors.returnDate && <p className="text-[10px] text-red-500 mt-1">{errors.returnDate}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="time"
                      value={form.returnTime}
                      onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 transition-colors"
                    />
                  </div>
                  {errors.returnTime && <p className="text-[10px] text-red-500 mt-1">{errors.returnTime}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Type</span><p className="font-semibold text-gray-800">{getOutpassTypeLabel(form.outpassType as OutpassType)}</p></div>
              <div><span className="text-gray-400">To</span><p className="font-semibold text-gray-800">{form.destination || '—'}</p></div>
              <div className="col-span-2"><span className="text-gray-400">Reason</span><p className="font-semibold text-gray-800 truncate">{form.reason || '—'}</p></div>
              <div><span className="text-gray-400">Student</span><p className="font-semibold text-gray-800">{currentUser.studentId}</p></div>
              <div><span className="text-gray-400">Chain</span><p className="font-semibold text-gray-800">{currentUser.studentType === 'hostel' ? 'Fac→HOD→War' : 'Fac→HOD'}</p></div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-primary-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:bg-primary-700 shadow-lg shadow-primary-200"
          >
            <Send className="w-4 h-4" />
            Submit Request
          </button>
        </div>
      )}
    </div>
  );
}
