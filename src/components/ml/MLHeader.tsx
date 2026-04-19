import { Brain, CalendarClock, Download, RefreshCw } from 'lucide-react';
import { AppButton, AppSelect } from '@/components/ui';
import type { MLForecastType } from '@/hooks/useMLAnalytics';

interface MLHeaderProps {
  period: number;
  selectedModel: 'all' | MLForecastType;
  training: boolean;
  onPeriodChange: (value: number) => void;
  onModelChange: (value: 'all' | MLForecastType) => void;
  onTrain: () => void;
  onSchedule: () => void;
  onExport: () => void;
}

export default function MLHeader({
  period,
  selectedModel,
  training,
  onPeriodChange,
  onModelChange,
  onTrain,
  onSchedule,
  onExport,
}: MLHeaderProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-[0_12px_34px_rgba(2,6,23,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            <Brain size={22} />
            AI Insights
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Forecast sales, expenses, and profit using the ML prediction service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppButton variant="secondary" onClick={onSchedule}>
            <CalendarClock size={14} />
            Schedule Report
          </AppButton>
          <AppButton variant="outline" onClick={onExport}>
            <Download size={14} />
            Export Predictions
          </AppButton>
          <AppButton variant="primary" onClick={onTrain} loading={training}>
            <RefreshCw size={14} className={training ? 'animate-spin' : ''} />
            {training ? 'Training' : 'Train Models'}
          </AppButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <AppSelect
          label="Forecast Period"
          value={String(period)}
          onChange={(value) => onPeriodChange(Number(value))}
          options={[
            { label: '7 Days', value: '7' },
            { label: '30 Days', value: '30' },
            { label: '90 Days', value: '90' },
            { label: '180 Days', value: '180' },
          ]}
        />

        <AppSelect
          label="Model"
          value={selectedModel}
          onChange={(value) => onModelChange(String(value) as 'all' | MLForecastType)}
          options={[
            { label: 'All Models', value: 'all' },
            { label: 'Sales', value: 'sales' },
            { label: 'Expenses', value: 'expenses' },
            { label: 'Profit', value: 'profit' },
          ]}
        />
      </div>
    </div>
  );
}
