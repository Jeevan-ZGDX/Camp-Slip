import { useStore } from '../../store/useStore';
import { timeAgo } from '../../utils/helpers';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Notifications() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  if (!currentUser) return null;

  const myNotifications = notifications.filter((n) => n.userId === currentUser.id);
  const unread = myNotifications.filter((n) => !n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
          <p className="text-xs text-gray-500">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-primary-600 font-bold flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-50 active:bg-primary-100"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Read All
          </button>
        )}
      </div>

      {myNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 text-sm">All caught up!</p>
          <p className="text-xs text-gray-500 mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myNotifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`w-full rounded-2xl border p-4 flex items-start gap-3 text-left transition-all active:scale-[0.99] ${
                notif.read
                  ? 'bg-white border-gray-100'
                  : notif.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : notif.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200'
                  : notif.type === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm ${notif.read ? 'font-medium text-gray-700' : 'font-bold text-gray-800'}`}>
                    {notif.title}
                  </h4>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                  {notif.relatedPassId && (
                    <span className="text-[10px] text-primary-500 font-mono bg-primary-50 px-1.5 py-0.5 rounded">{notif.relatedPassId}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
