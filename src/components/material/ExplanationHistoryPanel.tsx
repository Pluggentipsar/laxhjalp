import { Lightbulb } from 'lucide-react';
import { Card } from '../common/Card';

export type ExplanationHistoryItem = {
  id: string;
  text: string;
  explanation: string;
  definition?: string;
  example?: string;
  timestamp: Date;
};

type ExplanationHistoryPanelProps = {
  history: ExplanationHistoryItem[];
};

export function ExplanationHistoryPanel({ history }: ExplanationHistoryPanelProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Förklaringar
        </h3>
        {history.length > 0 && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
            {history.length}
          </span>
        )}
      </div>
      {history.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2"
            >
              <div className="font-semibold text-sm text-gray-900 dark:text-white">
                &quot;{item.text}&quot;
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {item.explanation}
              </p>
              {item.definition && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Definition:</span> {item.definition}
                </p>
              )}
              {item.example && (
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  Exempel: {item.example}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-600">
                {new Date(item.timestamp).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Markera text och välj &quot;Förklara&quot; för att få förklaringar här.
        </p>
      )}
    </Card>
  );
}
