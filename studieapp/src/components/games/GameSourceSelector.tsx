import { useMemo } from 'react';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { GamePreferences, Material, LanguageCode } from '../../types';

interface GameSourceSelectorProps {
  materials: Material[];
  preferences: GamePreferences;
  onUpdate: (updates: Partial<GamePreferences>) => void;
}

const SOURCE_LABELS: Record<GamePreferences['sourceMode'], { title: string; description: string }> = {
  'single-material': {
    title: 'Ett material',
    description: 'Välj ett material och spela med dess begrepp.',
  },
  'multi-material': {
    title: 'Flera material',
    description: 'Kombinera begrepp från flera material och skapa blandpass.',
  },
  generated: {
    title: 'Generera nytt',
    description: 'Låt AI skapa ett fristående begreppspaket att öva på.',
  },
};

const LANGUAGE_OPTIONS: Array<{ id: LanguageCode; label: string; helper: string }> = [
  { id: 'sv', label: 'Svenska', helper: 'Standard – svenska begrepp' },
  { id: 'en', label: 'Engelska', helper: 'Träna engelska ord' },
  { id: 'es', label: 'Spanska', helper: 'Perfekt för språkglosor' },
];

function getMaterialStats(material: Material) {
  const concepts = material.concepts?.length ?? 0;
  const flashcards = material.flashcards?.length ?? 0;
  const glossary = material.glossary?.length ?? 0;
  return concepts + flashcards + glossary;
}

export function GameSourceSelector({
  materials,
  preferences,
  onUpdate,
}: GameSourceSelectorProps) {
  const sortedMaterials = useMemo(
    () =>
      [...materials].sort(
        (a, b) =>
          (b.updatedAt?.getTime?.() || new Date(b.updatedAt).getTime()) -
          (a.updatedAt?.getTime?.() || new Date(a.updatedAt).getTime())
      ),
    [materials]
  );

  const handleSelectSource = (mode: GamePreferences['sourceMode']) => {
    let nextSelectedIds = [...preferences.selectedMaterialIds];
    let includeAll = preferences.includeAllMaterials;

    if (mode === 'single-material') {
      if (nextSelectedIds.length === 0 && materials.length > 0) {
        nextSelectedIds = [materials[0].id];
      } else if (nextSelectedIds.length > 0) {
        nextSelectedIds = [nextSelectedIds[0]];
      }
      includeAll = false;
    } else if (mode === 'multi-material') {
      if (nextSelectedIds.length === 0) {
        nextSelectedIds = materials.map((material) => material.id);
      }
    } else {
      includeAll = false;
    }

    onUpdate({
      sourceMode: mode,
      selectedMaterialIds: nextSelectedIds,
      includeAllMaterials: mode === 'multi-material' ? includeAll : false,
    });
  };

  const handleToggleMaterial = (materialId: string) => {
    if (preferences.sourceMode === 'single-material') {
      onUpdate({ selectedMaterialIds: [materialId] });
      return;
    }

    if (preferences.includeAllMaterials) {
      onUpdate({
        includeAllMaterials: false,
        selectedMaterialIds: [materialId],
      });
      return;
    }
    const exists = preferences.selectedMaterialIds.includes(materialId);
    onUpdate({
      selectedMaterialIds: exists
        ? preferences.selectedMaterialIds.filter((id) => id !== materialId)
        : [...preferences.selectedMaterialIds, materialId],
    });
  };

  const selectedIds = preferences.selectedMaterialIds;
  const selectedCount = preferences.includeAllMaterials ? materials.length : selectedIds.length;
  const generatedTopicValue = preferences.generatedTopicHint ?? '';
  const generatedTopicIsValid = generatedTopicValue.trim().length >= 3;

  return (
    <Card className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Innehållskälla</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bestäm vilka begrepp som ska användas när du spelar.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Sparkles className="h-4 w-4" />
          <span>
            {selectedCount > 0
              ? `${selectedCount} material valda`
              : 'Inga material valda'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(SOURCE_LABELS) as Array<GamePreferences['sourceMode']>).map((mode) => {
          const isActive = preferences.sourceMode === mode;
          const disableButton =
            (mode === 'single-material' && materials.length === 0) ||
            (mode === 'multi-material' && materials.length < 2);
          const labels = SOURCE_LABELS[mode];

          return (
            <button
              key={mode}
              type="button"
              onClick={() => !disableButton && handleSelectSource(mode)}
              className={`text-left rounded-2xl border px-4 py-3 transition-all ${
                isActive
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20 shadow-inner'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              } ${disableButton ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {labels.title}
                </h3>
                {isActive && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{labels.description}</p>
              {mode === 'multi-material' && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Layers className="h-3 w-3" />
                  Blanda flera material
                </span>
              )}
              {mode === 'generated' && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Sparkles className="h-3 w-3" />
                  AI-genererat paket
                </span>
              )}
              {disableButton && mode === 'single-material' && materials.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                  Lägg till ett material för att spela med denna källa.
                </p>
              )}
              {disableButton && mode === 'multi-material' && materials.length < 2 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                  Välj minst två material för att kombinera dem i spel.
                </p>
              )}
            </button>
          );
        })}
      </div>

      {preferences.sourceMode === 'generated' && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-4 dark:border-primary-800 dark:bg-primary-900/20 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              Skapa ett AI-paket
            </h3>
            <p className="text-xs text-primary-800/80 dark:text-primary-200/80">
              Skriv vad du vill öva på så fixar vi en begreppslista. Tips: välj språk nedan och testa
              att skriva något som “Djur på spanska” eller “Planeter i rymden”.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              Tema eller ämne
              <input
                value={preferences.generatedTopicHint ?? ''}
                onChange={(event) =>
                  onUpdate({ generatedTopicHint: event.target.value })
                }
                placeholder="t.ex. Djuren i djurparken på spanska"
                className="mt-1 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-primary-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary-800"
              />
            </label>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Språk
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((option) => {
                  const isActive = preferences.language === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onUpdate({ language: option.id })}
                      className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-primary-500 bg-white shadow-sm dark:border-primary-400 dark:bg-primary-900/40'
                          : 'border-primary-200 bg-white/80 hover:border-primary-300 dark:border-primary-800 dark:bg-gray-900'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
                        {option.helper}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {!generatedTopicIsValid && (
            <p className="rounded-xl bg-white/70 px-3 py-2 text-[11px] font-semibold text-primary-800 shadow-sm dark:bg-gray-900/40 dark:text-primary-200">
              Tips! Skriv minst tre tecken så att AI:n förstår vad den ska skapa. Exempel: “Djur på
              spanska” eller “Solens planeter”.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Välj material</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onUpdate({
                selectedMaterialIds:
                  preferences.includeAllMaterials && materials.length > 0
                    ? []
                    : materials.map((material) => material.id),
                includeAllMaterials: !preferences.includeAllMaterials,
              })
            }
            disabled={materials.length === 0}
          >
            {preferences.includeAllMaterials ? 'Rensa' : 'Välj alla'}
          </Button>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
            Du har ännu inga material. Skapa eller importera material för att spela.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {sortedMaterials.map((material) => {
              const isSelected = preferences.includeAllMaterials || selectedIds.includes(material.id);
              const termCount = getMaterialStats(material);
              return (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => handleToggleMaterial(material.id)}
                  className={`text-left rounded-xl border px-3 py-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {termCount} begrepp
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
