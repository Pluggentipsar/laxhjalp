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
    <Card className="p-5 sm:p-7 space-y-6 border-primary-100 dark:border-primary-900/30 bg-gradient-to-br from-white to-primary-50/30 dark:from-gray-900 dark:to-primary-950/20">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <Layers className="h-6 w-6 text-primary-500" />
            Innehållskälla
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bestäm vilka begrepp som ska användas när du spelar.
          </p>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800">
            <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-300" />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-200">
              {selectedCount} {selectedCount === 1 ? 'material valt' : 'material valda'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className={`group relative text-left rounded-2xl border-2 px-5 py-4 transition-all duration-200 ${
                isActive
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/30 dark:to-primary-950/20 dark:border-primary-400 shadow-lg shadow-primary-500/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
              } ${disableButton ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Selection indicator */}
              {isActive && (
                <div className="absolute top-3 right-3">
                  <div className="p-1 rounded-full bg-primary-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    {labels.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {labels.description}
                  </p>
                </div>

                {mode === 'multi-material' && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                    <Layers className="h-3.5 w-3.5" />
                    Blanda material
                  </span>
                )}
                {mode === 'generated' && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-genererat
                  </span>
                )}

                {disableButton && mode === 'single-material' && materials.length === 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    ⚠️ Lägg till material först
                  </p>
                )}
                {disableButton && mode === 'multi-material' && materials.length < 2 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    ⚠️ Behöver minst 2 material
                  </p>
                )}
              </div>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Välj material</h3>
          <Button
            size="sm"
            variant="outline"
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
            className="text-xs"
          >
            {preferences.includeAllMaterials ? 'Rensa alla' : 'Välj alla'}
          </Button>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Layers className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inga material ännu
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Skapa eller importera material för att komma igång med spel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {sortedMaterials.map((material) => {
              const isSelected = preferences.includeAllMaterials || selectedIds.includes(material.id);
              const termCount = getMaterialStats(material);
              return (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => handleToggleMaterial(material.id)}
                  className={`group text-left rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {termCount} {termCount === 1 ? 'begrepp' : 'begrepp'}
                      </p>
                    </div>
                    {isSelected ? (
                      <div className="p-1 rounded-full bg-primary-500 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-primary-400 shrink-0 transition-colors" />
                    )}
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
