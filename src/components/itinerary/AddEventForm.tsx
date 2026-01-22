'use client';

import { useState } from 'react';
import { Event } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddEventFormProps {
  isOpen: boolean;
  dayNumber: number;
  onClose: () => void;
  onAddEvent: (dayNumber: number, event: Event) => void;
}

const eventTypes: { value: Event['type']; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'transit', label: 'Transit' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'rest', label: 'Rest' },
];

export function AddEventForm({
  isOpen,
  dayNumber,
  onClose,
  onAddEvent,
}: AddEventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'activity' as Event['type'],
    time_start: '09:00',
    time_end: '10:00',
    duration_minutes: 60,
    location_name: '',
    cost: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEvent: Event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: 0,
      time_start: formData.time_start,
      time_end: formData.time_end,
      duration_minutes: formData.duration_minutes,
      type: formData.type,
      category: formData.type,
      title: formData.title,
      description: formData.description,
      location: formData.location_name
        ? {
            name: formData.location_name,
            address: '',
            coordinates: [0, 0],
          }
        : undefined,
      cost: formData.cost > 0
        ? {
            amount: formData.cost,
            currency: 'USD',
            category: formData.type,
          }
        : undefined,
      metadata: {
        booking_required: false,
        weather_dependent: false,
      },
    };

    onAddEvent(dayNumber, newEvent);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'activity',
      time_start: '09:00',
      time_end: '10:00',
      duration_minutes: 60,
      location_name: '',
      cost: 0,
    });
    onClose();
  };

  const handleTimeChange = (field: 'time_start' | 'time_end', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Calculate duration if both times are set
      if (updated.time_start && updated.time_end) {
        const [startH, startM] = updated.time_start.split(':').map(Number);
        const [endH, endM] = updated.time_end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        updated.duration_minutes = Math.max(0, endMinutes - startMinutes);
      }

      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Event to Day {dayNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Visit the museum"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Event['type']) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_start">Start Time</Label>
              <Input
                id="time_start"
                type="time"
                value={formData.time_start}
                onChange={(e) => handleTimeChange('time_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_end">End Time</Label>
              <Input
                id="time_end"
                type="time"
                value={formData.time_end}
                onChange={(e) => handleTimeChange('time_end', e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Duration: {formData.duration_minutes} minutes
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location_name: e.target.value }))
              }
              placeholder="e.g., Central Park"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (USD, optional)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              value={formData.cost || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cost: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Add any notes or details..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Add Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
