"use client";

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useState
} from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used inside <Tabs>.");
  }

  return context;
}

type TabsProps = {
  children: ReactNode;
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

export function Tabs({
  children,
  value,
  defaultValue,
  onValueChange,
  className
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();
  const activeValue = value ?? internalValue;

  const contextValue = useMemo(
    () => ({
      activeValue,
      setActiveValue: (nextValue: string) => {
        if (value === undefined) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      },
      baseId
    }),
    [activeValue, baseId, onValueChange, value]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)] p-1.5",
        className
      )}
      role="tablist"
      {...props}
    />
  );
}

type TabsTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
};

export function TabsTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: TabsTriggerProps) {
  const { activeValue, setActiveValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        isActive
          ? "bg-[color:var(--color-surface-elevated)] text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)]"
          : "text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-primary)]",
        className
      )}
      id={`${baseId}-tab-${value}`}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          setActiveValue(value);
        }
      }}
      role="tab"
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

type TabsPanelProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  forceMount?: boolean;
};

export function TabsPanel({
  value,
  forceMount = false,
  className,
  children,
  ...props
}: TabsPanelProps) {
  const { activeValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  if (!forceMount && !isActive) {
    return null;
  }

  return (
    <div
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cn(!isActive && "hidden", className)}
      id={`${baseId}-panel-${value}`}
      role="tabpanel"
      {...props}
    >
      {children}
    </div>
  );
}
