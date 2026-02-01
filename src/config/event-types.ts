'use client';

import { Briefcase, Activity, Utensils, Car, Bed } from 'lucide-react';
import { ComponentType } from 'react';
import { Event } from '@/types';

/**
 * Configuration for event type styling and icons.
 * This registry enables plug-and-play customization of event types.
 */
export interface EventTypeConfig {
  /** Icon component to display for this event type */
  icon: ComponentType<{ className?: string }>;
  /** Tailwind classes for the main card styling (background, border, text) */
  colorClass: string;
  /** Tailwind classes for stacked/background cards (lighter variant) */
  colorClassLight: string;
  /** Human-readable label for this event type */
  label: string;
}

/**
 * Default event type configurations.
 * New event types can be registered at runtime using registerEventType().
 */
export const EVENT_TYPE_REGISTRY: Record<Event['type'], EventTypeConfig> = {
  logistics: {
    icon: Briefcase,
    colorClass: 'bg-slate-100 border-slate-300 text-slate-700',
    colorClassLight: 'bg-slate-50 border-slate-200',
    label: 'Logistics',
  },
  activity: {
    icon: Activity,
    colorClass: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    colorClassLight: 'bg-emerald-50/50 border-emerald-200',
    label: 'Activity',
  },
  dining: {
    icon: Utensils,
    colorClass: 'bg-amber-50 border-amber-300 text-amber-700',
    colorClassLight: 'bg-amber-50/50 border-amber-200',
    label: 'Dining',
  },
  transit: {
    icon: Car,
    colorClass: 'bg-blue-50 border-blue-300 text-blue-700',
    colorClassLight: 'bg-blue-50/50 border-blue-200',
    label: 'Transit',
  },
  rest: {
    icon: Bed,
    colorClass: 'bg-purple-50 border-purple-300 text-purple-700',
    colorClassLight: 'bg-purple-50/50 border-purple-200',
    label: 'Rest',
  },
};

// Extended registry for runtime-registered types
const extendedRegistry: Record<string, EventTypeConfig> = {};

/**
 * Register a new event type at runtime.
 * This enables plug-and-play addition of custom event types.
 */
export function registerEventType(type: string, config: EventTypeConfig): void {
  extendedRegistry[type] = config;
}

/**
 * Get configuration for an event type.
 * Falls back to 'activity' config if the type is not found.
 */
export function getEventTypeConfig(type: string): EventTypeConfig {
  // Check extended registry first (allows overriding defaults)
  if (extendedRegistry[type]) {
    return extendedRegistry[type];
  }
  // Check default registry
  if (EVENT_TYPE_REGISTRY[type as Event['type']]) {
    return EVENT_TYPE_REGISTRY[type as Event['type']];
  }
  // Fallback to activity
  return EVENT_TYPE_REGISTRY.activity;
}

/**
 * Get the icon component for an event type.
 */
export function getEventTypeIcon(type: string): ComponentType<{ className?: string }> {
  return getEventTypeConfig(type).icon;
}

/**
 * Get the color classes for an event type.
 */
export function getEventTypeColors(type: string): { colorClass: string; colorClassLight: string } {
  const config = getEventTypeConfig(type);
  return {
    colorClass: config.colorClass,
    colorClassLight: config.colorClassLight,
  };
}
