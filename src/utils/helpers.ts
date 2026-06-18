import { ApprovalStatus, OutpassType, StudentType } from '../types';

export function getStatusColor(status: ApprovalStatus): string {
  switch (status) {
    case 'pending_faculty':
    case 'pending_hod':
    case 'pending_warden':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'expired':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'revoked':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'used':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case 'pending_faculty':
      return 'Pending Faculty';
    case 'pending_hod':
      return 'Pending HOD';
    case 'pending_warden':
      return 'Pending Warden';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    case 'revoked':
      return 'Revoked';
    case 'used':
      return 'Completed';
    default:
      return status;
  }
}

export function getOutpassTypeLabel(type: OutpassType): string {
  switch (type) {
    case 'regular':
      return 'Regular';
    case 'emergency':
      return 'Emergency';
    case 'medical':
      return 'Medical';
    case 'event':
      return 'Event';
    case 'weekend':
      return 'Weekend';
    default:
      return type;
  }
}

export function getOutpassTypeColor(type: OutpassType): string {
  switch (type) {
    case 'regular':
      return 'bg-blue-100 text-blue-700';
    case 'emergency':
      return 'bg-red-100 text-red-700';
    case 'medical':
      return 'bg-purple-100 text-purple-700';
    case 'event':
      return 'bg-teal-100 text-teal-700';
    case 'weekend':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getStudentTypeLabel(type: StudentType): string {
  return type === 'hostel' ? 'Hostel' : 'Day Scholar';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function generatePassId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `OP-${year}-${num}`;
}

export function getApprovalProgress(status: ApprovalStatus, studentType: StudentType): number {
  const totalSteps = studentType === 'hostel' ? 4 : 3;
  switch (status) {
    case 'pending_faculty':
      return (1 / totalSteps) * 100;
    case 'pending_hod':
      return (2 / totalSteps) * 100;
    case 'pending_warden':
      return (3 / totalSteps) * 100;
    case 'approved':
    case 'used':
      return 100;
    case 'rejected':
      return 100;
    default:
      return 0;
  }
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case 'student': return '🎓';
    case 'faculty': return '👨‍🏫';
    case 'hod': return '🏛️';
    case 'warden': return '🏠';
    case 'security': return '🛡️';
    case 'admin': return '⚙️';
    default: return '👤';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'student': return 'Student';
    case 'faculty': return 'Faculty Advisor';
    case 'hod': return 'Head of Department';
    case 'warden': return 'Warden';
    case 'security': return 'Security';
    case 'admin': return 'Administrator';
    default: return role;
  }
}
