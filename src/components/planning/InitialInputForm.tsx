'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Pencil, Check, Car } from 'lucide-react';
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
  destinations: string[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  budgetCategory: BudgetCategory | '';
  focus: TripFocus[];
  travelers: number;
  canDrive: boolean;
  additionalNotes: string;
}

interface InitialInputFormProps {
  onSubmit: (data: FormData) => void;
}

export function InitialInputForm({ onSubmit }: InitialInputFormProps) {
  const [formData, setFormData] = useState<FormData>({
    destinations: [''],
    startDate: undefined,
    endDate: undefined,
    budgetCategory: '',
    focus: [],
    travelers: 1,
    canDrive: false,
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Location management functions
  const addLocation = () => {
    if (formData.destinations.length >= 10) return;
    setFormData((prev) => ({
      ...prev,
      destinations: [...prev.destinations, ''],
    }));
  };

  const removeLocation = (index: number) => {
    if (formData.destinations.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index),
    }));
  };

  const updateLocation = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.map((d, i) => (i === index ? value : d)),
    }));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(formData.destinations[index]);
  };

  const saveEditing = () => {
    if (editingIndex !== null) {
      updateLocation(editingIndex, editValue);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

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

    const validDestinations = formData.destinations.filter((d) => d.trim());
    if (validDestinations.length === 0) {
      newErrors.destinations = 'Please enter at least one destination';
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
      {/* Destinations (Multi-city) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Where do you want to go?</Label>
          <span className="text-xs text-muted-foreground">
            {formData.destinations.length}/10 locations
          </span>
        </div>
        <div className="space-y-2">
          {formData.destinations.map((destination, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
              {editingIndex === index ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="e.g., Tokyo, Japan"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditing();
                      if (e.key === 'Escape') cancelEditing();
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={saveEditing}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={cancelEditing}>
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                </>
              ) : destination ? (
                <>
                  <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                    {destination}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(index)}
                  >
                    <Pencil className="h-4 w-4 text-gray-400" />
                  </Button>
                  {formData.destinations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Input
                    placeholder="e.g., Tokyo, Japan"
                    value={destination}
                    onChange={(e) => updateLocation(index, e.target.value)}
                    className={cn('flex-1', errors.destinations && 'border-red-500')}
                  />
                  {formData.destinations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {formData.destinations.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLocation}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another destination
          </Button>
        )}
        {errors.destinations && <p className="text-sm text-red-500">{errors.destinations}</p>}
        {formData.destinations.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Destinations will be visited in the order listed above.
          </p>
        )}
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

      {/* Can Drive */}
      <div className="space-y-2">
        <Label>Transportation</Label>
        <label className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:border-muted-foreground/50 transition-colors">
          <Checkbox
            checked={formData.canDrive}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, canDrive: checked === true }))
            }
          />
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Can you drive?</span>
              <p className="text-xs text-muted-foreground">
                Check this if you&apos;re able to rent and drive a car during your trip
              </p>
            </div>
          </div>
        </label>
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
