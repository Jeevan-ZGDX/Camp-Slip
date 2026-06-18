export type UserRole = 'student' | 'faculty' | 'hod' | 'warden' | 'security' | 'admin';
export type StudentType = 'day_scholar' | 'hostel';
export type OutpassType = 'regular' | 'emergency' | 'medical' | 'event' | 'weekend';

export type ApprovalStatus = 
  | 'pending_faculty' 
  | 'pending_hod' 
  | 'pending_warden' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'revoked'
  | 'used';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  studentType?: StudentType;
  phone?: string;
  parentPhone?: string;
  avatar?: string;
  year?: number;
  hostelBlock?: string;
  roomNumber?: string;
}

export interface OutpassRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentDept: string;
  studentType: StudentType;
  studentYear: number;
  studentRollNo: string;
  hostelBlock?: string;
  roomNumber?: string;
  outpassType: OutpassType;
  reason: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  facultyApproval?: ApprovalAction;
  hodApproval?: ApprovalAction;
  wardenApproval?: ApprovalAction;
  qrData?: string;
  exitTime?: string;
  entryTime?: string;
  parentNotified: boolean;
  parentPhone: string;
}

export interface ApprovalAction {
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected';
  timestamp: string;
  remarks?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  relatedPassId?: string;
}

export interface MovementLog {
  id: string;
  passId: string;
  studentId: string;
  studentName: string;
  action: 'exit' | 'entry';
  timestamp: string;
  verifiedBy: string;
  gateNumber: string;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedToday: number;
  rejectedToday: number;
  activeOutside: number;
  totalStudents: number;
}
