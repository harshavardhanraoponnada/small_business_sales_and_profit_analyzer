import type { ReactNode } from 'react';
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
}

/**
 * Public project tabs API that maps a typed tabs array to shadcn tabs.
 */
export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const initialValue = defaultValue ?? tabs[0]?.value;

  return (
    <ShadcnTabs defaultValue={initialValue} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
}
