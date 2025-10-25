import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CrosswordGame } from '../../components/games/CrosswordGame';
import { useAppStore } from '../../store/appStore';
import { generateConcepts } from '../../services/aiService';
import { generateCrossword } from '../../utils/crosswordGenerator';
import type { CrosswordGrid } from '../../types/crossword';

export function CrosswordPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const updateMaterial = useAppStore((state) => state.updateMaterial);
  const user = useAppStore((state) => state.user);

  const [crossword, setCrossword] = useState<CrosswordGrid | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = materials.find((m) => m.id === materialId);
  const grade = user?.grade || 5;

  useEffect(() => {
    if (material && !crossword) {
      handleGenerateCrossword();
    }
  }, [material?.id]);

  const handleGenerateCrossword = async () => {
    if (!material) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Check if we have concepts, if not generate them first
      let conceptsToUse = material.concepts || [];

      if (conceptsToUse.length === 0) {
        console.log('No concepts found, generating them first...');
        const generatedConcepts = await generateConcepts(material.content, { grade });
        conceptsToUse = generatedConcepts;

        // Save the concepts to the material
        await updateMaterial(material.id, {
          concepts: generatedConcepts,
          updatedAt: new Date(),
        });
      }

      // Generate the crossword from concepts
      const generatedCrossword = generateCrossword(conceptsToUse);

      if (!generatedCrossword) {
        setError('Kunde inte skapa ett korsord från begreppen. Försök lägga till fler begrepp.');
        return;
      }

      setCrossword(generatedCrossword);
    } catch (err) {
      console.error('Crossword generation error', err);
      setError('Kunde inte generera korsord. Försök igen.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!material) {
    return (
      <MainLayout title="Korsord">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <p className="text-gray-600 dark:text-gray-400">Material hittades inte.</p>
            <Button onClick={() => navigate('/study')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till studier
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Korsord">
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/study/material/${materialId}`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till material
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Korsord: {material.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {material.concepts?.length || 0} begrepp tillgängliga
            </p>
          </div>
          {crossword && (
            <Button
              variant="outline"
              onClick={handleGenerateCrossword}
              isLoading={isGenerating}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Generera nytt
            </Button>
          )}
        </div>

        {/* Main Content */}
        <Card>
          {isGenerating && !crossword ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Skapar korsord...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(!material.concepts || material.concepts.length === 0)
                    ? 'Genererar begrepp först'
                    : 'Skapar pussel från dina begrepp'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={handleGenerateCrossword}>
                Försök igen
              </Button>
            </div>
          ) : crossword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{crossword.words.length}</span> ord i korsordet
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Fyll i alla rutor för att kolla svaren
                </div>
              </div>
              <CrosswordGame crossword={crossword} />
            </div>
          ) : null}
        </Card>
      </div>
    </MainLayout>
  );
}
