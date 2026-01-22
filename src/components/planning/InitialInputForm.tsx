'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUDGET_CATEGORIES, TRIP_FOCUS_OPTIONS } from '@/lib/constants';
import { BudgetCategory, TripFocus } from '@/types';

interface FormData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budgetCategory: BudgetCategory | '';
  focus: TripFocus[];
  travelers: number;
  additionalNotes: string;
}

interface InitialInputFormProps {
  onSubmit: (data: FormData) => void;
}

export function InitialInputForm({ onSubmit }: InitialInputFormProps) {
  const [formData, setFormData] = useState<FormData>({
    destination: '',
    startDate: undefined,
    endDate: undefined,
    budgetCategory: '',
    focus: [],
    travelers: 1,
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleFocusToggle = (value: TripFocus) => {
    setFormData((prev) => ({
      ...prev,
      focus: prev.focus.includes(value)
        ? prev.focus.filter((f) => f !== value)
        : [...prev.focus, value],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.destination.trim()) {
      newErrors.destination = 'Please enter a destination';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Please select a start date';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Please select an end date';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.budgetCategory) {
      newErrors.budgetCategory = 'Please select a budget category';
    }
    if (formData.focus.length === 0) {
      newErrors.focus = 'Please select at least one focus';
    }
    if (formData.travelers < 1) {
      newErrors.travelers = 'At least 1 traveler required';
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
      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination">Where do you want to go?</Label>
        <Input
          id="destination"
          placeholder="e.g., Tokyo, Japan"
          value={formData.destination}
          onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
          className={cn(errors.destination && 'border-red-500')}
        />
        {errors.destination && <p className="text-sm text-red-500">{errors.destination}</p>}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.startDate && 'text-muted-foreground',
                  errors.startDate && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.endDate && 'text-muted-foreground',
                  errors.endDate && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                disabled={(date) => date < (formData.startDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      {/* Budget Category */}
      <div className="space-y-2">
        <Label>Budget</Label>
        <Select
          value={formData.budgetCategory}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, budgetCategory: value as BudgetCategory }))
          }
        >
          <SelectTrigger className={cn(errors.budgetCategory && 'border-red-500')}>
            <SelectValue placeholder="Select your budget level" />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex flex-col">
                  <span>{category.label}</span>
                  <span className="text-xs text-muted-foreground">{category.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.budgetCategory && <p className="text-sm text-red-500">{errors.budgetCategory}</p>}
      </div>

      {/* Trip Focus (Multi-select) */}
      <div className="space-y-2">
        <Label>What&apos;s your focus? (Select all that apply)</Label>
        <div className="grid grid-cols-2 gap-3">
          {TRIP_FOCUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors',
                formData.focus.includes(option.value as TripFocus)
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              )}
            >
              <Checkbox
                checked={formData.focus.includes(option.value as TripFocus)}
                onCheckedChange={() => handleFocusToggle(option.value as TripFocus)}
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.focus && <p className="text-sm text-red-500">{errors.focus}</p>}
      </div>

      {/* Number of Travelers */}
      <div className="space-y-2">
        <Label htmlFor="travelers">How many travelers?</Label>
        <Input
          id="travelers"
          type="number"
          min={1}
          max={20}
          value={formData.travelers}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))
          }
          className={cn('w-32', errors.travelers && 'border-red-500')}
        />
        {errors.travelers && <p className="text-sm text-red-500">{errors.travelers}</p>}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Anything else we should know? (Optional)</Label>
        <Textarea
          id="additionalNotes"
          placeholder="e.g., I'm celebrating my anniversary, prefer vegetarian restaurants, need wheelchair accessibility..."
          value={formData.additionalNotes}
          onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" className="w-full">
        Continue
      </Button>
    </form>
  );
}
