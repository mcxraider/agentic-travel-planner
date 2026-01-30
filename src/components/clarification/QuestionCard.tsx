'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ClarificationQuestion } from '@/types';

interface QuestionCardProps {
  question: ClarificationQuestion;
  value?: string | string[];
  onChange: (field: string, value: string | string[]) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  // Normalize value to array for internal handling
  const selectedOptions = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  );

  const [customInput, setCustomInput] = useState('');

  // Memoize the change handler to avoid unnecessary re-renders
  const handleChange = useCallback(
    (newValue: string | string[]) => {
      onChange(question.field, newValue);
    },
    [onChange, question.field]
  );

  // Handle option toggle
  const handleOptionToggle = (option: string) => {
    if (question.multi_select) {
      // Checkbox behavior - toggle in array
      const newSelected = selectedOptions.includes(option)
        ? selectedOptions.filter((o) => o !== option)
        : [...selectedOptions, option];
      handleChange(newSelected);
    } else {
      // Radio behavior - single selection
      handleChange(option);
    }
  };

  // Handle custom input change - allow spaces while typing, only trim on blur/submit
  const handleCustomInputChange = (inputValue: string) => {
    setCustomInput(inputValue);
    // Only update parent when there's actual content (allow spaces in the middle)
    if (inputValue.length > 0) {
      if (question.multi_select) {
        // Add custom input to selections (replace any previous custom input)
        const standardOptions = selectedOptions.filter((o) =>
          question.options.includes(o)
        );
        handleChange([...standardOptions, inputValue]);
      } else {
        // Use custom input as the selection
        handleChange(inputValue);
      }
    }
  };

  // Check if a custom value is selected (not in predefined options)
  const hasCustomValue =
    question.allow_custom_input &&
    selectedOptions.some((v) => !question.options.includes(v));

  // Initialize custom input only on mount or when value changes externally
  // Don't overwrite while user is actively typing (customInput has content)
  useEffect(() => {
    if (hasCustomValue && !customInput) {
      const customVal = selectedOptions.find(
        (v) => !question.options.includes(v)
      );
      if (customVal) {
        setCustomInput(customVal);
      }
    }
  }, [hasCustomValue, selectedOptions, question.options, customInput]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">
          {question.question_text}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Options */}
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <label
                key={option}
                className={cn(
                  'flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleOptionToggle(option)}
                />
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>

        {/* Custom Input */}
        {question.allow_custom_input && (
          <div className="space-y-2 pt-2 border-t">
            <Label
              htmlFor={`custom-${question.question_id}`}
              className="text-sm text-muted-foreground"
            >
              Or enter your own:
            </Label>
            <Input
              id={`custom-${question.question_id}`}
              placeholder="Type your answer..."
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              className={cn(hasCustomValue && 'border-primary')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
