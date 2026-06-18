import { create } from 'zustand';
import { User, OutpassRequest, Notification, MovementLog, ApprovalStatus } from '../types';
import { mockUsers, mockOutpasses, mockNotifications, mockMovementLogs } from '../data/mockData';

export interface AppSettings {
  // Notifications
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  parentNotifications: boolean;
  emergencyAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;

  // Security
  twoFactorAuth: boolean;
  biometricLogin: boolean;
  autoLock: boolean;
  autoLockTimeout: number; // minutes

  // Display
  darkMode: boolean;
  compactView: boolean;
  language: string;
  dateFormat: string;

  // Workflow
  autoApproveMedical: boolean;
  weekendAutoRoute: boolean;
  approvalTimeout: number; // hours

  // System
  instituteName: string;
  maxPassDays: number;
  timezone: string;
  auditLogging: boolean;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  outpasses: OutpassRequest[];
  notifications: Notification[];
  movementLogs: MovementLog[];
  settings: AppSettings;

  // Auth actions
  login: (userId: string) => void;
  logout: () => void;

  // Outpass actions
  createOutpass: (outpass: OutpassRequest) => void;
  updateOutpassStatus: (
    passId: string,
    status: ApprovalStatus,
    approverRole: 'faculty' | 'hod' | 'warden',
    approverId: string,
    approverName: string,
    action: 'approved' | 'rejected',
    remarks?: string
  ) => void;

  // Notification actions
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;

  // Movement log actions
  recordExit: (passId: string, verifiedBy: string) => void;
  recordEntry: (passId: string, verifiedBy: string) => void;

  // Settings actions
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  parentNotifications: true,
  emergencyAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
  twoFactorAuth: false,
  biometricLogin: false,
  autoLock: true,
  autoLockTimeout: 5,
  darkMode: false,
  compactView: false,
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  autoApproveMedical: false,
  weekendAutoRoute: true,
  approvalTimeout: 48,
  instituteName: 'ABC College of Engineering',
  maxPassDays: 7,
  timezone: 'Asia/Kolkata (IST)',
  auditLogging: true,
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  outpasses: mockOutpasses,
  notifications: mockNotifications,
  movementLogs: mockMovementLogs,
  settings: { ...defaultSettings },

  login: (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },

  logout: () => {
    set({ currentUser: null });
  },

  createOutpass: (outpass: OutpassRequest) => {
    set((state) => ({
      outpasses: [outpass, ...state.outpasses],
      notifications: [
        {
          id: `N-${Date.now()}`,
          userId: outpass.studentId,
          title: 'Request Submitted',
          message: `Your outpass ${outpass.id} has been submitted for approval.`,
          type: 'info' as const,
          read: false,
          createdAt: new Date().toISOString(),
          relatedPassId: outpass.id,
        },
        ...state.notifications,
      ],
    }));
  },

  updateOutpassStatus: (passId, status, approverRole, approverId, approverName, action, remarks) => {
    set((state) => {
      const outpass = state.outpasses.find((o) => o.id === passId);
      if (!outpass) return state;

      const approvalAction = {
        approverId,
        approverName,
        action,
        timestamp: new Date().toISOString(),
        remarks,
      };

      let newStatus = status;
      let qrData = outpass.qrData;

      if (action === 'rejected') {
        newStatus = 'rejected';
      } else if (action === 'approved') {
        if (approverRole === 'faculty') {
          newStatus = 'pending_hod';
        } else if (approverRole === 'hod') {
          if (outpass.studentType === 'hostel') {
            newStatus = 'pending_warden';
          } else {
            newStatus = 'approved';
            qrData = JSON.stringify({
              passId: outpass.id,
              studentId: outpass.studentRollNo,
              name: outpass.studentName,
              dept: outpass.studentDept,
              type: outpass.outpassType,
              status: 'approved',
              departure: outpass.departureTime,
              return: outpass.returnTime,
              hash: Math.random().toString(36).substring(2, 15),
              generated: new Date().toISOString(),
            });
          }
        } else if (approverRole === 'warden') {
          newStatus = 'approved';
          qrData = JSON.stringify({
            passId: outpass.id,
            studentId: outpass.studentRollNo,
            name: outpass.studentName,
            dept: outpass.studentDept,
            type: outpass.outpassType,
            status: 'approved',
            departure: outpass.departureTime,
            return: outpass.returnTime,
            hash: Math.random().toString(36).substring(2, 15),
            generated: new Date().toISOString(),
          });
        }
      }

      const updatedOutpass: OutpassRequest = {
        ...outpass,
        status: newStatus as ApprovalStatus,
        updatedAt: new Date().toISOString(),
        qrData,
        ...(approverRole === 'faculty' && { facultyApproval: approvalAction }),
        ...(approverRole === 'hod' && { hodApproval: approvalAction }),
        ...(approverRole === 'warden' && { wardenApproval: approvalAction }),
      };

      const statusMsg = action === 'approved'
        ? (newStatus === 'approved' ? 'Outpass Fully Approved! 🎉' : `${approverRole.charAt(0).toUpperCase() + approverRole.slice(1)} Approved`)
        : 'Outpass Rejected';

      const newNotification: Notification = {
        id: `N-${Date.now()}`,
        userId: outpass.studentId,
        title: statusMsg,
        message: action === 'approved'
          ? (newStatus === 'approved'
            ? `Your outpass ${passId} has been fully approved. QR pass is ready.`
            : `${approverName} approved your request. Awaiting next approval.`)
          : `${approverName} rejected your outpass.${remarks ? ' Reason: ' + remarks : ''}`,
        type: action === 'approved' ? (newStatus === 'approved' ? 'success' : 'info') : 'error',
        read: false,
        createdAt: new Date().toISOString(),
        relatedPassId: passId,
      };

      return {
        outpasses: state.outpasses.map((o) => (o.id === passId ? updatedOutpass : o)),
        notifications: [newNotification, ...state.notifications],
      };
    });
  },

  addNotification: (notification) => {
    set((state) => ({ notifications: [notification, ...state.notifications] }));
  },

  markNotificationRead: (notifId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    const user = get().currentUser;
    if (!user) return;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === user.id ? { ...n, read: true } : n
      ),
    }));
  },

  recordExit: (passId, verifiedBy) => {
    const outpass = get().outpasses.find((o) => o.id === passId);
    if (!outpass) return;
    const log: MovementLog = {
      id: `ML-${Date.now()}`,
      passId,
      studentId: outpass.studentId,
      studentName: outpass.studentName,
      action: 'exit',
      timestamp: new Date().toISOString(),
      verifiedBy,
      gateNumber: 'Gate 1 - Main',
    };
    set((state) => ({
      movementLogs: [log, ...state.movementLogs],
      outpasses: state.outpasses.map((o) =>
        o.id === passId ? { ...o, exitTime: new Date().toISOString() } : o
      ),
      notifications: [{
        id: `N-${Date.now()}`,
        userId: outpass.studentId,
        title: 'Campus Exit Recorded',
        message: `You have exited campus via Gate 1 at ${new Date().toLocaleTimeString()}.`,
        type: 'info' as const,
        read: false,
        createdAt: new Date().toISOString(),
        relatedPassId: passId,
      }, ...state.notifications],
    }));
  },

  recordEntry: (passId, verifiedBy) => {
    const outpass = get().outpasses.find((o) => o.id === passId);
    if (!outpass) return;
    const log: MovementLog = {
      id: `ML-${Date.now()}`,
      passId,
      studentId: outpass.studentId,
      studentName: outpass.studentName,
      action: 'entry',
      timestamp: new Date().toISOString(),
      verifiedBy,
      gateNumber: 'Gate 1 - Main',
    };
    set((state) => ({
      movementLogs: [log, ...state.movementLogs],
      outpasses: state.outpasses.map((o) =>
        o.id === passId
          ? { ...o, entryTime: new Date().toISOString(), status: 'used' as ApprovalStatus }
          : o
      ),
      notifications: [{
        id: `N-${Date.now()}`,
        userId: outpass.studentId,
        title: 'Campus Entry Recorded',
        message: `Welcome back! You have entered campus via Gate 1.`,
        type: 'success' as const,
        read: false,
        createdAt: new Date().toISOString(),
        relatedPassId: passId,
      }, ...state.notifications],
    }));
  },

  updateSetting: (key, value) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
  },

  resetSettings: () => {
    set({ settings: { ...defaultSettings } });
  },
}));
