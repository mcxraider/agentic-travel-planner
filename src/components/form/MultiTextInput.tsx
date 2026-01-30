'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField } from './FormField';

interface MultiTextInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxItems?: number;
  description?: string;
  disabled?: boolean;
}

export function MultiTextInput({
  label,
  values,
  onChange,
  placeholder = 'Type and press Enter',
  error,
  required,
  maxItems = 10,
  description,
  disabled,
}: MultiTextInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && values.length < maxItems && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || values.length >= maxItems}
            className={error ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAdd}
            disabled={
              disabled || !inputValue.trim() || values.length >= maxItems
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <Badge
                key={`${value}-${index}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {value}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {values.length >= maxItems && (
          <p className="text-xs text-muted-foreground">
            Maximum of {maxItems} items reached
          </p>
        )}
      </div>
    </FormField>
  );
}
