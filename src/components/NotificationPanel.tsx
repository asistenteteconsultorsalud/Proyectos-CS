import React from 'react';
import { SystemNotification } from '../types';
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  AlertOctagon, 
  AlertCircle, 
  X,
  CheckCircle,
  BellOff
} from 'lucide-react';

interface NotificationPanelProps {
  notifications: SystemNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onSelectProject: (projectId: string) => void;
  onClose: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectProject,
  onClose
}: NotificationPanelProps) {
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-250 shadow-2xl overflow-hidden animate-fade-in max-w-md w-full font-sans">
      {/* Header and Counters */}
      <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="p-2 bg-blue-50 border border-blue-150 rounded-xl inline-block text-blue-600">
              <Bell className="w-4.5 h-4.5" />
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] text-white rounded-full w-4.5 h-4.5 flex items-center justify-center font-black font-mono">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">Alertas & Notificaciones</h3>
            <p className="text-[10px] text-slate-500 font-medium">Monitoreo de cronogramas y compromisos</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub controls */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold">
        <span className="text-slate-500 uppercase tracking-wider text-[9px]">
          {notifications.length} Totales ({unreadCount} sin leer)
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-blue-650 hover:text-blue-800 font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-blue-650" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Notification Lists grouped by state */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-150">
        {notifications.length > 0 ? (
          notifications.map(notif => {
            const isUnread = !notif.read;

            return (
              <div 
                key={notif.id}
                className={`p-4 transition-all duration-200 flex gap-3 text-xs ${
                  isUnread ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Visual Icon Badge according to trigger type */}
                <span className="mt-0.5 shrink-0">
                  {notif.type === 'BLOCKER' ? (
                    <span className="p-2 bg-red-50 text-red-600 rounded-xl inline-block border border-red-100 shadow-xs animate-pulse">
                      <AlertOctagon className="w-4 h-4 text-red-650" />
                    </span>
                  ) : notif.type === 'OVERDUE' ? (
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl inline-block border border-amber-200 shadow-xs">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </span>
                  ) : (
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl inline-block border border-blue-150 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-blue-650" />
                    </span>
                  )}
                </span>

                <div className="space-y-1.5 flex-1 font-sans">
                  <div className="flex justify-between items-start gap-2">
                    <span 
                      onClick={() => {
                        onSelectProject(notif.projectId);
                        onClose();
                      }}
                      className="font-black text-slate-850 hover:text-blue-650 hover:underline cursor-pointer line-clamp-1"
                    >
                      {notif.projectName}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 whitespace-nowrap">
                      {notif.date}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[11px] font-medium">
                    {notif.message}
                  </p>

                  <div className="flex justify-between items-center pt-1.5">
                    <button
                      onClick={() => {
                        onSelectProject(notif.projectId);
                        onClose();
                      }}
                      className="text-blue-600 font-black text-[10px] hover:text-blue-800 hover:underline"
                    >
                      Resolver e inspeccionar &rarr;
                    </button>

                    {isUnread && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="text-slate-400 hover:text-emerald-750 font-bold text-[10px] flex items-center gap-0.5"
                        title="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Leído
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-3.5">
            <div className="p-4 bg-slate-50 rounded-full inline-block text-slate-350 border border-slate-100">
              <BellOff className="w-8 h-8" />
            </div>
            <p className="text-xs font-black text-slate-800 tracking-tight">Sin notificaciones de alerta</p>
            <p className="text-[10px] text-slate-500 font-medium">No hay desvíos de fechas ni bloqueos técnicos registrados actualmente.</p>
          </div>
        )}
      </div>
      
      {/* Visual Footer */}
      <div className="bg-slate-50 p-3 text-center text-[10px] text-slate-400 border-t border-slate-200 font-bold tracking-tight uppercase">
        Historial de alertas administrativas - Consultorsalud
      </div>
    </div>
  );
}
