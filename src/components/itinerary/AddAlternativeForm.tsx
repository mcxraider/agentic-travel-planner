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
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeftRight } from 'lucide-react';

interface AddAlternativeFormProps {
  isOpen: boolean;
  primaryEvent: Event | null;
  dayNumber: number;
  onClose: () => void;
  onAddAlternative: (dayNumber: number, primaryEventId: string, alternativeEvent: Event) => void;
}

const eventTypes: { value: Event['type']; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'rest', label: 'Rest' },
  { value: 'logistics', label: 'Logistics' },
];

export function AddAlternativeForm({
  isOpen,
  primaryEvent,
  dayNumber,
  onClose,
  onAddAlternative,
}: AddAlternativeFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: (primaryEvent?.type || 'activity') as Event['type'],
    location_name: '',
    cost: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!primaryEvent) return;

    const newAlternative: Event = {
      id: `evt_alt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: 0,
      // Use same time slot as primary event
      time_start: primaryEvent.time_start,
      time_end: primaryEvent.time_end,
      duration_minutes: primaryEvent.duration_minutes,
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

    onAddAlternative(dayNumber, primaryEvent.id, newAlternative);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'activity',
      location_name: '',
      cost: 0,
    });
    onClose();
  };

  if (!primaryEvent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            Add Alternative
          </DialogTitle>
        </DialogHeader>

        {/* Primary Event Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Alternative to:</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {primaryEvent.time_start} - {primaryEvent.time_end}
            </Badge>
            <span className="font-medium text-sm">{primaryEvent.title}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The alternative will use the same time slot
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alt-title">Title *</Label>
            <Input
              id="alt-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Sleep in instead"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alt-type">Type</Label>
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

          <div className="space-y-2">
            <Label htmlFor="alt-location">Location (optional)</Label>
            <Input
              id="alt-location"
              value={formData.location_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location_name: e.target.value }))
              }
              placeholder="e.g., Hotel room"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alt-cost">Cost (USD, optional)</Label>
            <Input
              id="alt-cost"
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
            <Label htmlFor="alt-description">Description (optional)</Label>
            <Textarea
              id="alt-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Why might you choose this alternative?"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Add Alternative
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
