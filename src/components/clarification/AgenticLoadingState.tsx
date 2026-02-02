'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStage {
  label: string;
  icon: typeof Brain;
  showTimer?: boolean;
}

const LOADING_STAGES: LoadingStage[] = [
  { label: 'Evaluating answer', icon: Brain },
  { label: 'Generating questions', icon: Sparkles },
  { label: 'Thought for', icon: Lightbulb, showTimer: true },
];

const STAGE_DURATION = 1500; // 1.5 seconds per stage

interface AgenticLoadingStateProps {
  isLoading: boolean;
  className?: string;
}

/**
 * Agentic loading state component that displays cycling stages
 * with a real elapsed time counter.
 */
export function AgenticLoadingState({ isLoading, className }: AgenticLoadingStateProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Reset state when loading starts
      startTimeRef.current = Date.now();
      setCurrentStage(0);
      setElapsedTime(0);

      // Update elapsed time every 100ms
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 100);

      // Cycle through stages every 1.5s
      stageIntervalRef.current = setInterval(() => {
        setCurrentStage((prev) => (prev + 1) % LOADING_STAGES.length);
      }, STAGE_DURATION);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        if (stageIntervalRef.current) {
          clearInterval(stageIntervalRef.current);
        }
      };
    } else {
      // Clear intervals when not loading
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  }, [isLoading]);

  if (!isLoading) {
    return null;
  }

  const stage = LOADING_STAGES[currentStage];
  const StageIcon = stage.icon;
  const elapsedSeconds = (elapsedTime / 1000).toFixed(1);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StageIcon className="h-4 w-4 animate-pulse text-primary" />
      <span className="text-sm text-muted-foreground">
        {stage.showTimer ? `${stage.label} ${elapsedSeconds}s` : `${stage.label}...`}
      </span>
    </div>
  );
}
