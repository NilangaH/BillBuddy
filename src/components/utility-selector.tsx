
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { Utility, UtilityLogos } from '@/lib/types';

interface UtilitySelectorProps {
  onSelect: (utility: Utility) => void;
  logos: UtilityLogos;
  pendingCounts: Record<Utility, number>;
}

const utilities: { name: Utility; description: string }[] = [
  {
    name: 'LECO',
    description: 'Lanka Electricity Company bill payments.',
  },
  {
    name: 'CEB',
    description: 'Ceylon Electricity Board bill payments.',
  },
  {
    name: 'Water',
    description: 'National Water Supply & Drainage Board.',
  },
];

export function UtilitySelector({ onSelect, logos, pendingCounts }: UtilitySelectorProps) {
  return (
    <section>
      <h2 className="mb-4 text-center text-2xl font-semibold font-headline">Choose a service to pay</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {utilities.map((utility) => {
          const count = pendingCounts[utility.name] || 0;
          return (
            <Card
              key={utility.name}
              onClick={() => onSelect(utility.name)}
              className="group relative cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary hover:-translate-y-1"
            >
              {count > 0 && (
                <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
                  {count}
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={logos[utility.name]}
                      alt={`${utility.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      data-ai-hint={`${utility.name.toLowerCase()} logo`}
                    />
                    <CardTitle className="font-headline text-2xl">{utility.name}</CardTitle>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{utility.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
