import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { formatDateTime, getOutpassTypeLabel } from '../../utils/helpers';
import { QrCode, Shield, CheckCircle, XCircle, LogIn, LogOut as LogOutIcon, Camera, ArrowLeft, RefreshCw } from 'lucide-react';

interface ScanResult {
  status: 'valid' | 'invalid' | 'expired' | 'duplicate' | 'used';
  pass?: any;
  message: string;
}

export default function QRScanner({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { currentUser, outpasses, recordExit, recordEntry } = useStore();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState('');

  if (!currentUser) return null;

  const simulateScan = (passId?: string) => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      const targetId = passId || 'OP-2024-0001';
      const pass = outpasses.find((o) => o.id === targetId);
      if (!pass) {
        setScanResult({ status: 'invalid', message: 'No pass found. QR may be forged or corrupted.' });
      } else if (pass.status === 'rejected' || pass.status === 'revoked') {
        setScanResult({ status: 'invalid', pass, message: `Pass has been ${pass.status}. Entry/Exit NOT permitted.` });
      } else if (pass.status === 'used') {
        setScanResult({ status: 'used', pass, message: 'Pass already used and completed.' });
      } else if (pass.status !== 'approved') {
        setScanResult({ status: 'invalid', pass, message: 'Pass not fully approved yet.' });
      } else if (pass.exitTime && pass.entryTime) {
        setScanResult({ status: 'duplicate', pass, message: 'Duplicate scan! Already used for exit and entry.' });
      } else {
        setScanResult({ status: 'valid', pass, message: pass.exitTime ? 'Student is returning to campus.' : 'Student authorized to exit campus.' });
      }
      setScanning(false);
    }, 1200);
  };

  const handleAction = () => {
    if (!scanResult?.pass) return;
    const pass = scanResult.pass;
    if (pass.exitTime && !pass.entryTime) {
      recordEntry(pass.id, currentUser.name);
      setScanResult({ ...scanResult, status: 'valid', message: '✅ Entry recorded! Student returned.' });
    } else if (!pass.exitTime) {
      recordExit(pass.id, currentUser.name);
      setScanResult({ ...scanResult, status: 'valid', message: '✅ Exit recorded! Student has left.' });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualInput('');
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">QR Pass Verification</h2>
          <p className="text-xs text-gray-500">Scan or enter pass ID</p>
        </div>
      </div>

      {!scanResult && (
        <div className="space-y-4">
          {/* Scanner Area */}
          <div className="bg-gray-900 rounded-2xl p-5 text-center">
            <div className="relative w-48 h-48 mx-auto border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
              {scanning ? (
                <>
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="scan-line absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                  </div>
                  <p className="text-emerald-400 text-sm font-medium animate-pulse">Scanning...</p>
                </>
              ) : (
                <div>
                  <Camera className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">Position QR here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Demo Buttons */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Demo Scans</h4>
            <div className="space-y-2">
              {[
                { id: 'OP-2024-0001', label: 'Valid Pass', sub: 'Arjun Sharma — Active', color: 'bg-emerald-50 text-emerald-700 active:bg-emerald-100' },
                { id: 'OP-2024-0005', label: 'Rejected Pass', sub: 'Priya Patel — Rejected', color: 'bg-red-50 text-red-700 active:bg-red-100' },
                { id: 'OP-2024-0004', label: 'Used Pass', sub: 'Arjun Sharma — Completed', color: 'bg-blue-50 text-blue-700 active:bg-blue-100' },
                { id: 'OP-FAKE-9999', label: 'Forged QR', sub: 'Invalid/Fake', color: 'bg-gray-50 text-gray-600 active:bg-gray-100' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => simulateScan(item.id)}
                  className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-colors ${item.color}`}
                >
                  <QrCode className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs opacity-70">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Manual Entry</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter Pass ID..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 transition-colors"
              />
              <button
                onClick={() => manualInput.trim() && simulateScan(manualInput.trim())}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold active:bg-primary-700 shrink-0"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="space-y-4 animate-slide-up">
          {/* Status Card */}
          <div className={`rounded-2xl p-6 text-center ${
            scanResult.status === 'valid' ? 'bg-emerald-50 border-2 border-emerald-200' :
            scanResult.status === 'used' ? 'bg-blue-50 border-2 border-blue-200' :
            'bg-red-50 border-2 border-red-200'
          }`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
              scanResult.status === 'valid' ? 'bg-emerald-100' :
              scanResult.status === 'used' ? 'bg-blue-100' :
              'bg-red-100'
            }`}>
              {scanResult.status === 'valid' ? <CheckCircle className="w-8 h-8 text-emerald-500" /> :
               scanResult.status === 'used' ? <Shield className="w-8 h-8 text-blue-500" /> :
               <XCircle className="w-8 h-8 text-red-500" />}
            </div>
            <h3 className={`text-lg font-extrabold ${
              scanResult.status === 'valid' ? 'text-emerald-800' :
              scanResult.status === 'used' ? 'text-blue-800' :
              'text-red-800'
            }`}>
              {scanResult.status === 'valid' ? 'PASS VERIFIED ✓' :
               scanResult.status === 'used' ? 'PASS COMPLETED' :
               scanResult.status === 'duplicate' ? 'DUPLICATE SCAN ⚠' :
               'INVALID PASS ✗'}
            </h3>
            <p className={`text-sm mt-1.5 ${
              scanResult.status === 'valid' ? 'text-emerald-600' :
              scanResult.status === 'used' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {scanResult.message}
            </p>
          </div>

          {/* Pass Details */}
          {scanResult.pass && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pass Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Pass ID', value: scanResult.pass.id },
                  { label: 'Student', value: scanResult.pass.studentName },
                  { label: 'Roll No', value: scanResult.pass.studentRollNo },
                  { label: 'Dept', value: scanResult.pass.studentDept },
                  { label: 'Type', value: getOutpassTypeLabel(scanResult.pass.outpassType) },
                  { label: 'Destination', value: scanResult.pass.destination },
                  { label: 'Departure', value: formatDateTime(scanResult.pass.departureTime) },
                  { label: 'Return', value: formatDateTime(scanResult.pass.returnTime) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            {scanResult.status === 'valid' && scanResult.pass && !scanResult.pass.entryTime && (
              <button
                onClick={handleAction}
                className={`flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-80 ${
                  scanResult.pass.exitTime
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {scanResult.pass.exitTime ? <><LogIn className="w-5 h-5" /> Record Entry</> : <><LogOutIcon className="w-5 h-5" /> Record Exit</>}
              </button>
            )}
            <button
              onClick={resetScanner}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 active:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" /> Scan Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
