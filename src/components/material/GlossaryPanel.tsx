import { GraduationCap } from 'lucide-react';
import { Card } from '../common/Card';
import type { GlossaryEntry } from '../../types';

type GlossaryPanelProps = {
  entries: GlossaryEntry[];
};

export function GlossaryPanel({ entries }: GlossaryPanelProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary-500" />
          Ordlista
        </h3>
        {entries.length > 0 && (
          <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
            {entries.length}
          </span>
        )}
      </div>
      {entries.length > 0 ? (
        <dl className="space-y-3 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2"
            >
              <dt className="text-sm font-semibold text-gray-900 dark:text-white">
                {entry.term}
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {entry.definition}
                {entry.example && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                    Exempel: {entry.example}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Markera text och välj &quot;Lägg till i ordlistan&quot; för att spara ord här.
        </p>
      )}
    </Card>
  );
}
