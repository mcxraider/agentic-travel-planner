'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Question } from '@/types';
import { RankedSelector } from './RankedSelector';

interface QuestionCardProps {
  question: Question;
  value?: unknown;
  onChange: (field: string, value: unknown) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  // Memoize the change handler to avoid unnecessary re-renders
  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(question.field, newValue);
    },
    [onChange, question.field]
  );

  // Render based on question type
  switch (question.type) {
    case 'single_select':
      return (
        <SingleSelectCard
          question={question}
          value={value as string | undefined}
          onChange={handleChange}
        />
      );
    case 'multi_select':
      return (
        <MultiSelectCard
          question={question}
          value={value as string[] | undefined}
          onChange={handleChange}
        />
      );
    case 'ranked':
      return (
        <RankedCard
          question={question}
          value={value as Record<string, string> | undefined}
          onChange={handleChange}
        />
      );
    case 'text':
      return (
        <TextCard
          question={question}
          value={value as string | undefined}
          onChange={handleChange}
        />
      );
    default:
      return null;
  }
}

// Single Select Component
interface SingleSelectCardProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
}

function SingleSelectCard({ question, value, onChange }: SingleSelectCardProps) {
  const [customInput, setCustomInput] = useState('');

  const hasCustomValue =
    question.allow_custom && value && !question.options.includes(value);

  useEffect(() => {
    if (hasCustomValue && !customInput) {
      setCustomInput(value || '');
    }
  }, [hasCustomValue, value, customInput]);

  const handleOptionSelect = (option: string) => {
    setCustomInput('');
    onChange(option);
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomInput(inputValue);
    if (inputValue.length > 0) {
      onChange(inputValue);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = value === option;
            const inputId = `${question.id}-${option}`;
            return (
              <label
                key={option}
                htmlFor={inputId}
                className={cn(
                  'flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                )}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={question.id}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleOptionSelect(option)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    isSelected ? 'border-primary' : 'border-muted-foreground'
                  )}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>

        {question.allow_custom && (
          <div className="space-y-2 pt-2 border-t">
            <Label
              htmlFor={`custom-${question.id}`}
              className="text-sm text-muted-foreground"
            >
              Or enter your own:
            </Label>
            <Input
              id={`custom-${question.id}`}
              placeholder="Type your answer..."
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              onClick={() => handleOptionSelect('')}
              className={cn(hasCustomValue && 'border-primary')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Multi Select Component
interface MultiSelectCardProps {
  question: Question;
  value?: string[];
  onChange: (value: string[]) => void;
}

function MultiSelectCard({ question, value, onChange }: MultiSelectCardProps) {
  const selectedOptions = useMemo(() => value || [], [value]);
  const [customInput, setCustomInput] = useState('');

  const hasCustomValue =
    question.allow_custom &&
    selectedOptions.some((v) => !question.options.includes(v));

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

  const handleOptionToggle = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    onChange(newSelected);
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomInput(inputValue);
    if (inputValue.length > 0) {
      const standardOptions = selectedOptions.filter((o) =>
        question.options.includes(o)
      );
      onChange([...standardOptions, inputValue]);
    }
  };

  const { min_selections, max_selections } = question;
  const selectionHint =
    min_selections && max_selections
      ? `Select ${min_selections}-${max_selections} options`
      : min_selections
        ? `Select at least ${min_selections} options`
        : max_selections
          ? `Select up to ${max_selections} options`
          : 'Select all that apply';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{question.question}</CardTitle>
        <p className="text-sm text-muted-foreground">{selectionHint}</p>
      </CardHeader>
      <CardContent className="space-y-3">
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

        {question.allow_custom && (
          <div className="space-y-2 pt-2 border-t">
            <Label
              htmlFor={`custom-${question.id}`}
              className="text-sm text-muted-foreground"
            >
              Or add your own:
            </Label>
            <Input
              id={`custom-${question.id}`}
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

// Ranked Component
interface RankedCardProps {
  question: Question;
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

function RankedCard({ question, value, onChange }: RankedCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{question.question}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Rank your choices in order of preference (most preferred first)
        </p>
      </CardHeader>
      <CardContent>
        <RankedSelector
          options={question.options}
          value={value}
          onChange={onChange}
          allowCustom={question.allow_custom}
          maxSelections={question.max_selections || 3}
        />
      </CardContent>
    </Card>
  );
}

// Text Component
interface TextCardProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
}

function TextCard({ question, value, onChange }: TextCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{question.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your answer..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px]"
        />
      </CardContent>
    </Card>
  );
}
