'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiTextInput } from '@/components/form';
import { useTripStore } from '@/store';
import { UserProfile } from '@/types';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { userProfile, updateUserProfile } = useTripStore();

  const [formData, setFormData] = useState<UserProfile>({
    user_name: '',
    citizenship: '',
    health_limitations: '',
    work_obligations: '',
    dietary_restrictions: '',
    specific_interests: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});

  // Sync form with store when opening
  useEffect(() => {
    if (open) {
      setFormData({
        user_name: userProfile.user_name || '',
        citizenship: userProfile.citizenship || '',
        health_limitations: userProfile.health_limitations || '',
        work_obligations: userProfile.work_obligations || '',
        dietary_restrictions: userProfile.dietary_restrictions || '',
        specific_interests: userProfile.specific_interests || [],
      });
      setErrors({});
    }
  }, [open, userProfile]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserProfile, string>> = {};

    if (!formData.user_name?.trim()) {
      newErrors.user_name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      updateUserProfile(formData);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>
            Help us personalize your trip recommendations by sharing some
            information about yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Name (required) */}
          <div className="space-y-2">
            <Label htmlFor="user_name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user_name"
              placeholder="Enter your name"
              value={formData.user_name || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, user_name: e.target.value }))
              }
              className={errors.user_name ? 'border-red-500' : ''}
            />
            {errors.user_name && (
              <p className="text-sm text-red-500">{errors.user_name}</p>
            )}
          </div>

          {/* Citizenship */}
          <div className="space-y-2">
            <Label htmlFor="citizenship">Citizenship (optional)</Label>
            <Input
              id="citizenship"
              placeholder="e.g., United States"
              value={formData.citizenship || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, citizenship: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Helps us check visa requirements
            </p>
          </div>

          {/* Health Limitations */}
          <div className="space-y-2">
            <Label htmlFor="health_limitations">
              Health Limitations (optional)
            </Label>
            <Textarea
              id="health_limitations"
              placeholder="e.g., mobility issues, allergies..."
              value={formData.health_limitations || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  health_limitations: e.target.value,
                }))
              }
              rows={2}
            />
          </div>

          {/* Work Obligations */}
          <div className="space-y-2">
            <Label htmlFor="work_obligations">Work Obligations (optional)</Label>
            <Textarea
              id="work_obligations"
              placeholder="e.g., need WiFi for remote work, must be available for calls in mornings..."
              value={formData.work_obligations || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  work_obligations: e.target.value,
                }))
              }
              rows={2}
            />
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-2">
            <Label htmlFor="dietary_restrictions">
              Dietary Restrictions (optional)
            </Label>
            <Input
              id="dietary_restrictions"
              placeholder="e.g., vegetarian, gluten-free, halal..."
              value={formData.dietary_restrictions || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dietary_restrictions: e.target.value,
                }))
              }
            />
          </div>

          {/* Specific Interests */}
          <MultiTextInput
            label="Specific Interests (optional)"
            values={formData.specific_interests || []}
            onChange={(interests) =>
              setFormData((prev) => ({ ...prev, specific_interests: interests }))
            }
            placeholder="Add interest and press Enter"
            description="e.g., temples, ramen, hiking, museums"
            maxItems={10}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
