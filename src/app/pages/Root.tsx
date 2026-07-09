import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { useScheduler } from '../hooks/useScheduler';
import { AlarmDialog } from '../components/AlarmDialog';
import { PWASetup } from '../components/PWASetup';
import { InstallPrompt } from '../components/InstallPrompt';
import { useEffect } from 'react';
import { requestNotificationPermission } from '../utils/notifications';

export function Root() {
  const { tasks, getActiveAlarms, snoozeAlarm, dismissAlarm } = useScheduler();
  const activeAlarms = getActiveAlarms();

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PWASetup />
      <Outlet />
      <BottomNav />
      <InstallPrompt />
      <Toaster position="top-center" />

      {activeAlarms.map((alarm) => {
        const task = tasks.find(t => t.id === alarm.taskId);
        return (
          <AlarmDialog
            key={`${alarm.taskId}-${alarm.type}`}
            alarm={alarm}
            task={task}
            onSnooze={snoozeAlarm}
            onDismiss={dismissAlarm}
          />
        );
      })}
    </div>
  );
}
