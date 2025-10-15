import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Tag,
  BookOpen,
  Sparkles,
  MessageSquare,
  Gamepad2,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ImportMenu } from '../components/material/ImportMenu';
import { CreateMaterialModal } from '../components/material/CreateMaterialModal';
import { useAppStore } from '../store/appStore';
import type { Material, Subject } from '../types';

const SUBJECT_FILTERS: Subject[] = ['svenska', 'engelska', 'matte', 'no', 'so'];

const subjectLabels: Record<Subject, string> = {
  svenska: 'Svenska',
  engelska: 'Engelska',
  matte: 'Matematik',
  no: 'NO',
  so: 'SO',
  idrott: 'Idrott',
  annat: 'Annat',
};

export function StudyDashboardPage() {
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const addMaterial = useAppStore((state) => state.addMaterial);
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
    <MainLayout
      title="Studera"
      headerAction={
        <Button
          size="sm"
          onClick={() => setShowImportMenu(true)}
          className="bg-gradient-primary shadow-glow"
        >
          <Plus size={20} />
        </Button>
      }
    >
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

      <div className="py-6 space-y-6">
        <section className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl px-6 py-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="uppercase text-xs tracking-widest text-white/70 mb-2">
                Plugghjälp
              </p>
              <h1 className="text-3xl font-bold">Samla och studera allt på ett ställe</h1>
              <p className="text-white/80 mt-3 max-w-xl">
                Skapa eller ladda upp nytt material och låt AI:n hjälpa dig med quiz,
                flashcards och personliga chattsamtal. Börja med att välja ett material nedan.
              </p>
            </div>
            <div>
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-white/90"
                onClick={() => setShowImportMenu(true)}
              >
                <Plus size={20} className="mr-2" />
                Ladda upp / Skapa material
              </Button>
            </div>
          </div>
        </section>

        {materials.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fortsätt där du slutade
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('all');
                }}
              >
                Visa allt
              </Button>
            </div>
            {recentMaterial.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentMaterial.map((material) => (
                  <Card key={material.id} hover className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary-500">
                          {subjectLabels[material.subject]}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {material.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Uppdaterad {material.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/study/material/${material.id}`)}
                      >
                        Öppna
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/study/material/${material.id}/chat`)}
                      >
                        <MessageSquare size={16} className="mr-1" />
                        Chatt
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/study/flashcards/${material.id}`)
                        }
                        disabled={material.flashcards.length === 0}
                      >
                        <Sparkles size={16} className="mr-1" />
                        Flashcards
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-sm text-gray-500">
                Börja med att skapa eller importera material. Dina senaste resurser
                visas här för snabb åtkomst.
              </Card>
            )}
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mitt material
              </h2>
              <p className="text-sm text-gray-500">
                Filtrera på ämne eller sök efter rubrik, innehåll eller taggar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Sök material..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm w-full sm:w-72"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSubject('all')}
                  className={`px-3 py-2 rounded-xl text-sm border transition ${
                    selectedSubject === 'all'
                      ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Alla ämnen
                </button>
                {SUBJECT_FILTERS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-2 rounded-xl text-sm border transition ${
                      selectedSubject === subject
                        ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {subjectLabels[subject]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((material) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card hover className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {material.title}
                        </h3>
                        <p className="text-xs uppercase tracking-wide text-primary-500">
                          {subjectLabels[material.subject]}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Uppdaterad {material.updatedAt.toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {material.content || 'Ingen text ännu. Lägg till innehåll i detaljvyn.'}
                    </p>

                    <div className="flex gap-2 flex-wrap items-center">
                      {material.simplifiedContent && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Förenklad
                        </span>
                      )}
                      {material.advancedContent && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          Fördjupad
                        </span>
                      )}
                    </div>

                    {material.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {material.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                          >
                            <Tag size={12} />
                            {tag}
                          </span>
                        ))}
                        {material.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{material.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/study/material/${material.id}`)}
                      >
                        <BookOpen size={16} className="mr-1" />
                        Detaljer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/study/material/${material.id}/chat`)}
                      >
                        <MessageSquare size={16} className="mr-1" />
                        Chatt
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/study/material/${material.id}/game/snake`)}
                      >
                        <Gamepad2 size={16} className="mr-1" />
                        Snake
                      </Button>
                    </div>
                  </Card>
                </motion.div>
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
