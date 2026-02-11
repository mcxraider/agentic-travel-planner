'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, name: 'Trip Details', key: 'input' },
  { id: 2, name: 'Preferences', key: 'clarification' },
  { id: 3, name: 'Research', key: 'research' },
  { id: 4, name: 'Day Planning', key: 'planning' },
  { id: 5, name: 'Review', key: 'review' },
];

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li key={step.id} className="relative flex-1">
              <div className="flex flex-col items-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-4 left-1/2 h-0.5 w-full',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}

                {/* Step circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary',
                    !isCompleted && !isCurrent && 'border-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
