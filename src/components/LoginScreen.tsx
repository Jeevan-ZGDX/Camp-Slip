import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getRoleIcon, getRoleLabel } from '../utils/helpers';
import { Shield, QrCode, ChevronRight, Lock, Scan, Zap, CheckCircle2 } from 'lucide-react';

const loginOptions = [
  { id: 'STU001', role: 'student', name: 'Arjun Sharma', sub: 'CS2024001 · Hostel Student' },
  { id: 'STU002', role: 'student', name: 'Priya Patel', sub: 'EC2024015 · Day Scholar' },
  { id: 'FAC001', role: 'faculty', name: 'Dr. Meera Iyer', sub: 'Computer Science · Faculty Advisor' },
  { id: 'HOD001', role: 'hod', name: 'Prof. Rajesh Nair', sub: 'Computer Science · Head of Dept.' },
  { id: 'WAR001', role: 'warden', name: 'Mr. Suresh Menon', sub: 'Hostel Administration · Warden' },
  { id: 'SEC001', role: 'security', name: 'Ravi Prakash', sub: 'Gate Security Personnel' },
  { id: 'ADM001', role: 'admin', name: 'Dr. Anita Desai', sub: 'System Administrator' },
];

export default function LoginScreen() {
  const { login } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 via-primary-700 to-primary-900 flex flex-col">
      {/* Decorative circles */}
      <div className="absolute top-20 -right-16 w-48 h-48 bg-white/5 rounded-full blur-xl" />
      <div className="absolute top-40 -left-12 w-32 h-32 bg-white/5 rounded-full blur-xl" />
      <div className="absolute bottom-40 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg" />

      {/* Top section - branding */}
      <div className="relative pt-14 pb-8 px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-4 border border-white/20 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Campus<span className="text-primary-200">Pass</span>
        </h1>
        <p className="text-primary-200/80 mt-2 text-sm font-medium max-w-xs mx-auto leading-relaxed">
          Digital Student Outpass & Movement Management System
        </p>

        {/* Feature pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
          <FeaturePill icon={<QrCode className="w-3 h-3" />} text="QR Passes" />
          <FeaturePill icon={<Scan className="w-3 h-3" />} text="Gate Scan" />
          <FeaturePill icon={<Zap className="w-3 h-3" />} text="Auto-Approve" />
          <FeaturePill icon={<CheckCircle2 className="w-3 h-3" />} text="Real-time" />
        </div>
      </div>

      {/* Bottom sheet - login selector */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-2xl relative">
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3">
          <h2 className="text-lg font-bold text-gray-800">Select Your Role</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choose a demo account to continue</p>
        </div>

        {/* Scrollable role list */}
        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div className="space-y-2">
            {loginOptions.map((option, idx) => {
              const isSelected = selectedId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedId(option.id);
                    setTimeout(() => login(option.id), 300);
                  }}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 text-left active:scale-[0.98]
                    ${isSelected
                      ? 'bg-primary-50 border-2 border-primary-300 shadow-md'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all
                    ${isSelected ? 'bg-primary-100 shadow-sm scale-110' : 'bg-white shadow-sm'}`}>
                    {getRoleIcon(option.role)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                      {option.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{option.sub}</p>
                  </div>

                  {/* Role badge + Arrow */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                      {getRoleLabel(option.role)}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-all ${
                      isSelected ? 'text-primary-500 translate-x-0.5' : 'text-gray-300'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <Lock className="w-3 h-3" />
            <span>JWT Secured · RBAC · AES-256 QR Encryption · Audit Logged</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-1">© 2024 CampusPass v2.0</p>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-primary-200 text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
      {icon}
      <span className="font-medium">{text}</span>
    </span>
  );
}
