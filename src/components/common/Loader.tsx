import { LoadingState } from '@/components/ui';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export default function Loader({ fullScreen = false, message = 'Loading...' }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <LoadingState type="spinner" />
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="w-full py-8">{content}</div>;
}
