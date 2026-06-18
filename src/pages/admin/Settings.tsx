import { useState } from 'react';
import { useStore, AppSettings } from '../../store/useStore';
import {
  Bell, Shield, Moon, Zap, Database, ChevronRight,
  ChevronDown, RotateCcw, Check, AlertCircle, Info
} from 'lucide-react';

type SettingSectionId = 'notifications' | 'security' | 'display' | 'workflow' | 'system';

export default function Settings() {
  const { settings, updateSetting, resetSettings, currentUser } = useStore();
  const [openSections, setOpenSections] = useState<SettingSectionId[]>(['notifications']);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSection = (id: SettingSectionId) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    showToast();
  };

  const showToast = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isAdmin = currentUser?.role === 'admin';

  const sections: {
    id: SettingSectionId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage alerts and push notifications',
      icon: <Bell className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      subtitle: 'Authentication, biometrics, auto-lock',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'display',
      title: 'Display & Language',
      subtitle: 'Theme, date format, language',
      icon: <Moon className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
    ...(isAdmin ? [{
      id: 'workflow' as SettingSectionId,
      title: 'Approval Workflow',
      subtitle: 'Configure approval chains and timeouts',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-amber-600 bg-amber-50',
    }] : []),
    ...(isAdmin ? [{
      id: 'system' as SettingSectionId,
      title: 'System Configuration',
      subtitle: 'Institute name, limits, audit logging',
      icon: <Database className="w-5 h-5" />,
      color: 'text-red-600 bg-red-50',
    }] : []),
  ];

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500">Customize your experience</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-slide-down">
          <Check className="w-4 h-4" />
          Settings saved!
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center">Reset Settings?</h3>
            <p className="text-sm text-gray-500 text-center mt-2">This will restore all settings to their default values. This action cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:bg-red-800"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSections.includes(section.id);

          return (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{section.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="border-t border-gray-100 animate-fade-in">
                  {section.id === 'notifications' && (
                    <NotificationSettings settings={settings} update={updateSetting} onChange={showToast} />
                  )}
                  {section.id === 'security' && (
                    <SecuritySettings settings={settings} update={updateSetting} onChange={showToast} />
                  )}
                  {section.id === 'display' && (
                    <DisplaySettings settings={settings} update={updateSetting} onChange={showToast} />
                  )}
                  {section.id === 'workflow' && (
                    <WorkflowSettings settings={settings} update={updateSetting} onChange={showToast} />
                  )}
                  {section.id === 'system' && (
                    <SystemSettings settings={settings} update={updateSetting} onChange={showToast} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* App Info */}
      <div className="mt-6 mb-4 text-center">
        <p className="text-xs text-gray-400 font-medium">CampusPass v2.0.0</p>
        <p className="text-[10px] text-gray-300 mt-0.5">FastAPI · PostgreSQL · Flutter · React · Firebase FCM</p>
      </div>
    </div>
  );
}

// ========== Toggle Switch Component ==========
function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${
        disabled ? 'bg-gray-200 cursor-not-allowed' : value ? 'bg-primary-500' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ========== Setting Row ==========
function SettingRow({
  label,
  description,
  right,
  onClick,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''} transition-colors`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {right}
      {onClick && !right && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
    </div>
  );
}

// ========== Select Setting ==========
function SelectSetting({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <SettingRow
      label={label}
      description={description}
      right={
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-primary-200"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      }
    />
  );
}

// ========== Number Setting ==========
function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <span className="text-sm font-bold text-primary-600">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ========== Notification Settings ==========
function NotificationSettings({
  settings,
  update,
  onChange,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onChange: () => void;
}) {
  const toggle = (key: keyof AppSettings) => {
    update(key, !settings[key]);
    onChange();
  };

  return (
    <div className="divide-y divide-gray-50">
      <SettingRow
        label="Push Notifications"
        description="Receive real-time alerts on your device"
        right={<Toggle value={settings.pushNotifications} onChange={() => toggle('pushNotifications')} />}
      />
      <SettingRow
        label="Email Notifications"
        description="Get updates via email"
        right={<Toggle value={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />}
      />
      <SettingRow
        label="SMS Notifications"
        description="Important alerts via text message"
        right={<Toggle value={settings.smsNotifications} onChange={() => toggle('smsNotifications')} />}
      />
      <SettingRow
        label="Parent Notifications"
        description="Notify parents on approval, exit, and entry"
        right={<Toggle value={settings.parentNotifications} onChange={() => toggle('parentNotifications')} />}
      />
      <SettingRow
        label="Emergency Alerts"
        description="High-priority alerts that override Do Not Disturb"
        right={<Toggle value={settings.emergencyAlerts} onChange={() => toggle('emergencyAlerts')} />}
      />
      <SettingRow
        label="Sound"
        description="Play sound for notifications"
        right={<Toggle value={settings.soundEnabled} onChange={() => toggle('soundEnabled')} />}
      />
      <SettingRow
        label="Vibration"
        description="Vibrate on notifications"
        right={<Toggle value={settings.vibrationEnabled} onChange={() => toggle('vibrationEnabled')} />}
      />
    </div>
  );
}

// ========== Security Settings ==========
function SecuritySettings({
  settings,
  update,
  onChange,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onChange: () => void;
}) {
  const toggle = (key: keyof AppSettings) => {
    update(key, !settings[key]);
    onChange();
  };

  return (
    <div className="divide-y divide-gray-50">
      <SettingRow
        label="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        right={<Toggle value={settings.twoFactorAuth} onChange={() => toggle('twoFactorAuth')} />}
      />
      <SettingRow
        label="Biometric Login"
        description="Use fingerprint or face recognition to log in"
        right={<Toggle value={settings.biometricLogin} onChange={() => toggle('biometricLogin')} />}
      />
      <SettingRow
        label="Auto-Lock"
        description="Automatically lock the app when inactive"
        right={<Toggle value={settings.autoLock} onChange={() => toggle('autoLock')} />}
      />
      {settings.autoLock && (
        <NumberSetting
          label="Auto-Lock Timeout"
          description="Time before the app locks automatically"
          value={settings.autoLockTimeout}
          min={1}
          max={30}
          unit="min"
          onChange={(v) => { update('autoLockTimeout', v); onChange(); }}
        />
      )}
      <div className="px-4 py-3 bg-blue-50">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">Your session is secured with JWT tokens and encrypted with AES-256. All actions are audit-logged.</p>
        </div>
      </div>
    </div>
  );
}

// ========== Display Settings ==========
function DisplaySettings({
  settings,
  update,
  onChange,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onChange: () => void;
}) {
  const toggle = (key: keyof AppSettings) => {
    update(key, !settings[key]);
    onChange();
  };

  return (
    <div className="divide-y divide-gray-50">
      <SettingRow
        label="Dark Mode"
        description="Use dark theme across the app"
        right={<Toggle value={settings.darkMode} onChange={() => toggle('darkMode')} />}
      />
      <SettingRow
        label="Compact View"
        description="Show more content with smaller spacing"
        right={<Toggle value={settings.compactView} onChange={() => toggle('compactView')} />}
      />
      <SelectSetting
        label="Language"
        description="Choose your preferred language"
        value={settings.language}
        options={['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']}
        onChange={(v) => { update('language', v); onChange(); }}
      />
      <SelectSetting
        label="Date Format"
        description="How dates are displayed"
        value={settings.dateFormat}
        options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
        onChange={(v) => { update('dateFormat', v); onChange(); }}
      />
      <SelectSetting
        label="Time Format"
        value="12-hour"
        options={['12-hour', '24-hour']}
        onChange={() => onChange()}
      />
    </div>
  );
}

// ========== Workflow Settings (Admin only) ==========
function WorkflowSettings({
  settings,
  update,
  onChange,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onChange: () => void;
}) {
  const toggle = (key: keyof AppSettings) => {
    update(key, !settings[key]);
    onChange();
  };

  return (
    <div className="divide-y divide-gray-50">
      <SettingRow
        label="Auto-Approve Medical Emergencies"
        description="Skip faculty approval for medical emergency requests"
        right={<Toggle value={settings.autoApproveMedical} onChange={() => toggle('autoApproveMedical')} />}
      />
      <SettingRow
        label="Weekend Auto-Route"
        description="Automatically route weekend requests through warden"
        right={<Toggle value={settings.weekendAutoRoute} onChange={() => toggle('weekendAutoRoute')} />}
      />
      <NumberSetting
        label="Approval Timeout"
        description="Auto-reject if no action taken within this time"
        value={settings.approvalTimeout}
        min={12}
        max={120}
        unit="hrs"
        onChange={(v) => { update('approvalTimeout', v); onChange(); }}
      />
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Approval Chains</p>
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm">
            <span className="text-xs font-medium text-gray-500 w-20">Day Scholar</span>
            <span className="flex-1 text-xs font-medium text-gray-700">
              Student → Faculty → HOD → QR Pass
            </span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 text-sm">
            <span className="text-xs font-medium text-gray-500 w-20">Hostel</span>
            <span className="flex-1 text-xs font-medium text-gray-700">
              Student → Faculty → HOD → Warden → QR Pass
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== System Settings (Admin only) ==========
function SystemSettings({
  settings,
  update,
  onChange,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onChange: () => void;
}) {
  return (
    <div className="divide-y divide-gray-50">
      <SettingRow
        label="Institution Name"
        description="Name displayed on passes and reports"
        right={
          <input
            type="text"
            value={settings.instituteName}
            onChange={(e) => { update('instituteName', e.target.value); onChange(); }}
            className="text-sm text-primary-600 bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-200 w-40 text-right"
          />
        }
      />
      <NumberSetting
        label="Maximum Pass Duration"
        description="Maximum number of days for a single outpass"
        value={settings.maxPassDays}
        min={1}
        max={30}
        unit="days"
        onChange={(v) => { update('maxPassDays', v); onChange(); }}
      />
      <SelectSetting
        label="Timezone"
        value={settings.timezone}
        options={['Asia/Kolkata (IST)', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']}
        onChange={(v) => { update('timezone', v); onChange(); }}
      />
      <SettingRow
        label="Audit Logging"
        description="Log all system actions for compliance and security"
        right={
          <Toggle
            value={settings.auditLogging}
            onChange={() => { update('auditLogging', !settings.auditLogging); onChange(); }}
          />
        }
      />
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tech Stack</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Backend', value: 'FastAPI (Python)' },
            { label: 'Database', value: 'PostgreSQL 16' },
            { label: 'Mobile', value: 'Flutter 3.22' },
            { label: 'Web', value: 'React 19 + Vite' },
            { label: 'Auth', value: 'JWT + RBAC' },
            { label: 'Push', value: 'Firebase FCM' },
            { label: 'QR', value: 'AES-256 Encrypted' },
            { label: 'Hosting', value: 'Docker + K8s' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400">{item.label}</p>
              <p className="text-xs font-semibold text-gray-700">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
