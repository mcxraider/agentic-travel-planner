'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerField, MultiTextInput, NumericStepper } from '@/components/form';
import {
  CURRENCY_OPTIONS,
  BUDGET_SCOPE_OPTIONS,
} from '@/lib/constants';

/**
 * Form data structure matching the StartSessionRequest for clarification API
 */
export interface TripInputFormData {
  destination: string;
  destination_cities: string[];
  start_date: Date | undefined;
  end_date: Date | undefined;
  budget: number | '';
  currency: string;
  adults: number;
  children: number;
  elderly: number;
  budget_scope: string;
}

interface InitialInputFormProps {
  onSubmit: (data: TripInputFormData) => void;
  isLoading?: boolean;
  isServerOffline?: boolean;
}

export function InitialInputForm({ onSubmit, isLoading, isServerOffline }: InitialInputFormProps) {
  const [formData, setFormData] = useState<TripInputFormData>({
    destination: '',
    destination_cities: [],
    start_date: undefined,
    end_date: undefined,
    budget: '',
    currency: 'USD',
    adults: 1,
    children: 0,
    elderly: 0,
    budget_scope: 'Total trip budget',
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof TripInputFormData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TripInputFormData, string>> = {};

    if (!formData.destination.trim()) {
      newErrors.destination = 'Please enter a destination';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Please select a start date';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'Please select an end date';
    }
    if (
      formData.start_date &&
      formData.end_date &&
      formData.start_date > formData.end_date
    ) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = 'Please enter a valid budget greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      {/* Destination (required) */}
      <div className="space-y-2">
        <Label htmlFor="destination">
          Where do you want to go? <span className="text-red-500">*</span>
        </Label>
        <Input
          id="destination"
          placeholder="e.g., Japan, Italy, Thailand"
          value={formData.destination}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, destination: e.target.value }))
          }
          className={cn(errors.destination && 'border-red-500')}
          disabled={isLoading}
        />
        {errors.destination && (
          <p className="text-sm text-red-500">{errors.destination}</p>
        )}
      </div>

      {/* Destination Cities (optional) */}
      <MultiTextInput
        label="Specific cities to visit (optional)"
        values={formData.destination_cities}
        onChange={(cities) =>
          setFormData((prev) => ({ ...prev, destination_cities: cities }))
        }
        placeholder="Add a city and press Enter"
        description="e.g., Tokyo, Kyoto, Osaka"
        maxItems={10}
        disabled={isLoading}
      />

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <DatePickerField
          label="Start Date"
          value={formData.start_date}
          onChange={(date) =>
            setFormData((prev) => ({ ...prev, start_date: date }))
          }
          minDate={new Date()}
          error={errors.start_date}
          required
          disabled={isLoading}
        />
        <DatePickerField
          label="End Date"
          value={formData.end_date}
          onChange={(date) =>
            setFormData((prev) => ({ ...prev, end_date: date }))
          }
          minDate={formData.start_date || new Date()}
          error={errors.end_date}
          required
          disabled={isLoading}
        />
      </div>

      {/* Budget and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">
            Budget <span className="text-red-500">*</span>
          </Label>
          <Input
            id="budget"
            type="number"
            min={1}
            placeholder="e.g., 5000"
            value={formData.budget}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                budget: e.target.value ? parseFloat(e.target.value) : '',
              }))
            }
            className={cn(errors.budget && 'border-red-500')}
            disabled={isLoading}
          />
          {errors.budget && (
            <p className="text-sm text-red-500">{errors.budget}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, currency: value }))
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Travel Party */}
      <div className="space-y-2">
        <Label>Travel Party</Label>
        <div className="grid grid-cols-3 gap-4">
          <NumericStepper
            label="Adults"
            value={formData.adults}
            min={1}
            max={20}
            onChange={(v) => setFormData((prev) => ({ ...prev, adults: v }))}
            disabled={isLoading}
          />
          <NumericStepper
            label="Children"
            value={formData.children}
            min={0}
            max={20}
            onChange={(v) => setFormData((prev) => ({ ...prev, children: v }))}
            disabled={isLoading}
          />
          <NumericStepper
            label="Elderly"
            value={formData.elderly}
            min={0}
            max={20}
            onChange={(v) => setFormData((prev) => ({ ...prev, elderly: v }))}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Budget Scope */}
      <div className="space-y-2">
        <Label>Budget Scope</Label>
        <Select
          value={formData.budget_scope}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, budget_scope: value }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_SCOPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How should we interpret your budget?
        </p>
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" className="w-full" disabled={isLoading || isServerOffline}>
        {isLoading ? 'Starting...' : isServerOffline ? 'Server Offline' : 'Start Planning'}
      </Button>
    </form>
  );
}
