import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';

export function ConceptExplorerPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const endSession = useAppStore((state) => state.endSession);
  const navigate = useNavigate();

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = materials.find((item) => item.id === materialId);

  if (!material) {
    return (
      <MainLayout title="Begreppskarta">
        <div className="py-10 flex flex-col items-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  const handleFinish = async () => {
    await endSession(15, { conceptsReviewed: material.concepts.length });
    navigate('/study');
  };

  return (
    <MainLayout title="Begreppskarta">
      <div className="py-6 space-y-6">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {material.title}
            </h2>
            <span className="text-sm text-gray-500">
              {material.concepts.length} begrepp genererade
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Här kan du bläddra bland de viktigaste begreppen från ditt material.
            En interaktiv mindmap kommer framöver – tills vidare kan du läsa
            definitioner och exempel här.
          </p>
        </section>

        {material.concepts.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold mb-2">Inga begrepp ännu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Gå tillbaka till Studera-sidan och generera begrepp först.
            </p>
            <Button onClick={() => navigate('/study')}>Tillbaka</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {material.concepts.map((concept, index) => (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                      Begrepp {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {concept.term}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {concept.definition}
                    </p>
                  </div>
                  {concept.examples && concept.examples.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <strong className="text-gray-700 dark:text-gray-300">
                        Exempel:
                      </strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {concept.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {material.concepts.length > 0 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/study')}>
              Tillbaka till studieöversikten
            </Button>
            <Button onClick={handleFinish}>Markera som bearbetat</Button>
          </div>
        )}
        {material.concepts.length === 0 && (
          <div>
            <Button variant="ghost" onClick={() => navigate('/study')}>
              Tillbaka till studieöversikten
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
