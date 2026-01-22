'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Option } from '@/types';
import { DollarSign, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  option: Option;
  onSelect: () => void;
  selected?: boolean;
}

const energyLevelConfig = {
  light: { label: 'Light', color: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  strenuous: { label: 'Strenuous', color: 'bg-red-100 text-red-700' },
};

export function OptionCard({ option, onSelect, selected = false }: OptionCardProps) {
  const energyConfig = energyLevelConfig[option.energy_level as keyof typeof energyLevelConfig] || {
    label: option.energy_level,
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary hover:shadow-md',
        selected && 'border-primary ring-2 ring-primary/20'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{option.title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {option.cost}
            </Badge>
            <Badge className={cn('flex items-center gap-1', energyConfig.color)}>
              <Zap className="h-3 w-3" />
              {energyConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{option.description}</p>

        {option.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {option.highlights.map((highlight, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {highlight}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
