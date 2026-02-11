'use client';

import { useState, useEffect } from 'react';
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

interface EditEventFormProps {
  isOpen: boolean;
  event: Event | null;
  dayNumber: number;
  onClose: () => void;
  onEditEvent: (dayNumber: number, eventId: string, updatedFields: Partial<Event>) => void;
}

const eventTypes: { value: Event['type']; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'transit', label: 'Transit' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'rest', label: 'Rest' },
];

export function EditEventForm({
  isOpen,
  event,
  dayNumber,
  onClose,
  onEditEvent,
}: EditEventFormProps) {
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

  // Pre-populate form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        type: event.type,
        time_start: event.time_start,
        time_end: event.time_end,
        duration_minutes: event.duration_minutes,
        location_name: event.location?.name || '',
        cost: event.cost?.amount || 0,
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const updatedFields: Partial<Event> = {};

    if (formData.title !== event.title) updatedFields.title = formData.title;
    if (formData.description !== event.description) updatedFields.description = formData.description;
    if (formData.type !== event.type) {
      updatedFields.type = formData.type;
      updatedFields.category = formData.type;
    }
    if (formData.time_start !== event.time_start) updatedFields.time_start = formData.time_start;
    if (formData.time_end !== event.time_end) updatedFields.time_end = formData.time_end;
    if (formData.duration_minutes !== event.duration_minutes) updatedFields.duration_minutes = formData.duration_minutes;

    const originalLocationName = event.location?.name || '';
    if (formData.location_name !== originalLocationName) {
      updatedFields.location = formData.location_name
        ? {
            name: formData.location_name,
            address: event.location?.address || '',
            coordinates: event.location?.coordinates || [0, 0],
          }
        : undefined;
    }

    const originalCost = event.cost?.amount || 0;
    if (formData.cost !== originalCost) {
      updatedFields.cost = formData.cost > 0
        ? {
            amount: formData.cost,
            currency: event.cost?.currency || 'USD',
            category: formData.type,
          }
        : undefined;
    }

    onEditEvent(dayNumber, event.id, updatedFields);
    onClose();
  };

  const handleTimeChange = (field: 'time_start' | 'time_end', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Visit the museum"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Type</Label>
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
              <Label htmlFor="edit-time_start">Start Time</Label>
              <Input
                id="edit-time_start"
                type="time"
                value={formData.time_start}
                onChange={(e) => handleTimeChange('time_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time_end">End Time</Label>
              <Input
                id="edit-time_end"
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
            <Label htmlFor="edit-location">Location (optional)</Label>
            <Input
              id="edit-location"
              value={formData.location_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location_name: e.target.value }))
              }
              placeholder="e.g., Central Park"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cost">Cost (USD, optional)</Label>
            <Input
              id="edit-cost"
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
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Add any notes or details..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
