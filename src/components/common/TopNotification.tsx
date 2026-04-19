import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

type NotificationType = 'success' | 'info' | 'error';

interface TopNotificationProps {
  title: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose: () => void;
}

const palette: Record<NotificationType, string> = {
  success:
    'border-emerald-200/80 bg-emerald-50 text-emerald-900 shadow-emerald-200/40 dark:border-emerald-800/80 dark:bg-emerald-950/80 dark:text-emerald-100',
  info:
    'border-sky-200/80 bg-sky-50 text-sky-900 shadow-sky-200/40 dark:border-sky-800/80 dark:bg-sky-950/80 dark:text-sky-100',
  error:
    'border-red-200/80 bg-red-50 text-red-900 shadow-red-200/40 dark:border-red-800/80 dark:bg-red-950/80 dark:text-red-100',
};

const iconMap = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
} as const;

export default function TopNotification({
  title,
  message,
  type = 'success',
  duration = 2600,
  onClose,
}: TopNotificationProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    const timer = window.setTimeout(() => {
      setEntered(false);
      window.setTimeout(onClose, 180);
    }, duration);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [duration, onClose]);

  const Icon = iconMap[type];

  const notification = (
    <div className="pointer-events-none fixed inset-x-0 top-3 sm:top-4 z-[9999] flex justify-center px-3">
      <div
        className={`pointer-events-auto w-full max-w-lg rounded-xl border px-4 py-3 shadow-xl transition-all duration-200 ${palette[type]} ${
          entered ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="mt-0.5 text-sm opacity-90">{message}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEntered(false);
              window.setTimeout(onClose, 160);
            }}
            className="rounded-md p-1 opacity-80 transition hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return notification;
  }

  return createPortal(notification, document.body);
}
