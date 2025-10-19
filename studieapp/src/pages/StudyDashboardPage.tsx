import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ImportMenu } from '../components/material/ImportMenu';
import { CreateMaterialModal } from '../components/material/CreateMaterialModal';
import { MaterialCard } from '../components/material/MaterialCard';
import { SubjectDropdown } from '../components/material/SubjectDropdown';
import GenerateMaterialPanel from '../components/material/GenerateMaterialPanel';
import { useAppStore } from '../store/appStore';
import type { Material, Subject } from '../types';


export function StudyDashboardPage() {
  const materials = useAppStore((state) => state.materials);
  const addMaterial = useAppStore((state) => state.addMaterial);
  const deleteMaterial = useAppStore((state) => state.deleteMaterial);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleCreateMaterial = async (data: {
    title: string;
    subject: Subject;
    content: string;
    tags: string[];
  }) => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      title: data.title,
      subject: data.subject,
      content: data.content,
      tags: data.tags,
      type: 'text',
      excerpts: [],
      flashcards: [],
      questions: [],
      concepts: [],
      glossary: [],
      simplifiedContent: undefined,
      advancedContent: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      generationHistory: [],
    };

    await addMaterial(newMaterial);
  };

  const filteredMaterials = useMemo(() => {
    return materials
      .filter((material) => {
        const matchesSearch =
          material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          );

        const matchesSubject =
          selectedSubject === 'all' || material.subject === selectedSubject;

        return matchesSearch && matchesSubject;
      })
      .sort(
        (a, b) =>
          (b.lastStudied?.getTime() || b.updatedAt.getTime()) -
          (a.lastStudied?.getTime() || a.updatedAt.getTime())
      );
  }, [materials, searchQuery, selectedSubject]);

  const recentMaterial = filteredMaterials.slice(0, 3);

  return (
    <MainLayout title="Studera">
      <ImportMenu
        isOpen={showImportMenu}
        onClose={() => setShowImportMenu(false)}
        onSelectOption={(type) => {
          if (type === 'text') {
            setShowCreateModal(true);
          } else {
            alert(`${type} kommer snart! Använd "Skriv/Klistra in" tills vidare.`);
          }
        }}
      />

      <CreateMaterialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMaterial}
      />

      <div className="py-6 space-y-8">
        {/* Compact Hero with CTAs */}
        <section className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white rounded-3xl px-6 py-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Vad vill du göra idag?</h1>
              <p className="text-white/80 mt-2 text-sm sm:text-base">
                Generera nytt material med AI eller ladda upp egna texter
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={() => {
                  // Scroll to GenerateMaterialPanel
                  const panel = document.getElementById('generate-panel');
                  if (panel) {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <Sparkles size={20} className="mr-2" />
                Generera material
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
                onClick={() => setShowImportMenu(true)}
              >
                <Plus size={20} className="mr-2" />
                Ladda upp/Skapa
              </Button>
            </div>
          </div>
        </section>

        {/* AI Material Generation Panel */}
        <div id="generate-panel">
          <GenerateMaterialPanel />
        </div>

        {/* Fortsätt där du slutade */}
        {materials.length > 0 && recentMaterial.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Fortsätt där du slutade
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMaterial.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onDelete={deleteMaterial}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Mitt material */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Mitt material
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'material'}
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Sök efter titel, innehåll eller taggar..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <SubjectDropdown
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
            />
          </div>

          {/* Material grid */}
          {filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onDelete={deleteMaterial}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Inget material hittades
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Skapa nytt material eller justera dina filter.
              </p>
              <Button onClick={() => setShowImportMenu(true)}>
                <Plus size={18} className="mr-2" />
                Skapa material
              </Button>
            </Card>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
