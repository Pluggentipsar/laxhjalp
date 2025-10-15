import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CreateMaterialModal } from '../components/material/CreateMaterialModal';
import { ImportMenu } from '../components/material/ImportMenu';
import {
  Plus,
  Search,
  BookOpen,
  Tag,
} from 'lucide-react';
import type { Subject, Material } from '../types';

const subjectGradients: Record<Subject, string> = {
  svenska: 'bg-gradient-to-br from-pink-500 to-rose-600',
  engelska: 'bg-gradient-to-br from-teal-400 to-cyan-600',
  matte: 'bg-gradient-to-br from-indigo-500 to-purple-600',
  no: 'bg-gradient-to-br from-emerald-400 to-green-600',
  so: 'bg-gradient-to-br from-amber-400 to-orange-600',
  idrott: 'bg-gradient-to-br from-rose-400 to-red-600',
  annat: 'bg-gradient-to-br from-gray-400 to-gray-600',
};

const subjectColors: Record<Subject, string> = {
  svenska: 'text-svenska',
  engelska: 'text-engelska',
  matte: 'text-matte',
  no: 'text-no',
  so: 'text-so',
  idrott: 'text-idrott',
  annat: 'text-gray-500',
};

export function MaterialPage() {
  const materials = useAppStore((state) => state.materials);
  const addMaterial = useAppStore((state) => state.addMaterial);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

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
      imageUrl: undefined,
      pdfUrl: undefined,
      excerpts: [],
      flashcards: [],
      questions: [],
      concepts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addMaterial(newMaterial);
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSubject =
      selectedSubject === 'all' || material.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const subjects: Subject[] = ['svenska', 'engelska', 'matte', 'no', 'so'];

  return (
    <MainLayout
      title="Material"
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
            // TODO: Implementera andra import-typer
            alert(`${type} kommer snart! Använd "Skriv/Klistra In" för nu.`);
          }
        }}
      />

      <CreateMaterialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMaterial}
      />

      <div className="py-6 space-y-6">
        {/* Sök - Snyggare design */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Sök bland ditt material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
          />
        </motion.div>

        {/* Filter på ämne - Snyggare chips */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSubject('all')}
            className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all font-semibold text-sm ${
              selectedSubject === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📚 Alla
          </motion.button>
          {subjects.map((subject) => (
            <motion.button
              key={subject}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSubject(subject)}
              className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all capitalize font-semibold text-sm ${
                selectedSubject === subject
                  ? `${subjectGradients[subject]} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {subject === 'svenska' && '🇸🇪'}
              {subject === 'engelska' && '🇬🇧'}
              {subject === 'matte' && '🔢'}
              {subject === 'no' && '🔬'}
              {subject === 'so' && '🌍'}
              {' '}{subject}
            </motion.button>
          ))}
        </motion.div>

        {/* Material lista - Modernare design */}
        {filteredMaterials.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            {filteredMaterials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Link to={`/material/${material.id}`}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="group"
                  >
                    <Card className="p-0 overflow-hidden border-2 border-gray-100 dark:border-gray-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-300 hover:shadow-xl">
                      {/* Gradient header med bättre design */}
                      <div className={`${subjectGradients[material.subject]} p-5 text-white relative overflow-hidden`}>
                        {/* Dekorativ bakgrund */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-xl mb-1 text-white drop-shadow-md flex-1">
                              {material.title}
                            </h3>
                            <BookOpen size={24} className="text-white/70 ml-3 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-white/90 capitalize font-medium">
                            {material.subject === 'svenska' && '🇸🇪'}
                            {material.subject === 'engelska' && '🇬🇧'}
                            {material.subject === 'matte' && '🔢'}
                            {material.subject === 'no' && '🔬'}
                            {material.subject === 'so' && '🌍'}
                            {' '}{material.subject}
                          </p>
                        </div>
                      </div>

                      {/* Content med bättre spacing */}
                      <div className="p-5 bg-white dark:bg-gray-900">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                          {material.content.substring(0, 140)}...
                        </p>

                        {/* Stats med ikoner */}
                        <div className="flex items-center gap-5 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                              <span className="text-sm">🎴</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {material.flashcards.length}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">kort</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <span className="text-sm">❓</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {material.questions.length}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">frågor</span>
                          </div>
                        </div>

                        {/* Tags med bättre design */}
                        {material.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {material.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700"
                              >
                                <Tag size={12} className="text-gray-400" />
                                {tag}
                              </span>
                            ))}
                            {material.tags.length > 3 && (
                              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-semibold">
                                +{material.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hover indicator */}
                      <div className="h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center py-16 relative overflow-hidden">
              {/* Dekorativa element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                {searchQuery || selectedSubject !== 'all' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                      className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center"
                    >
                      <Search className="text-gray-400" size={40} />
                    </motion.div>
                    <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-3">
                      Inga resultat hittades
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Prova att söka på något annat eller ändra filtret
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSubject('all');
                      }}
                      variant="outline"
                    >
                      Rensa filter
                    </Button>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
                      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30"
                    >
                      <BookOpen className="text-white" size={48} />
                    </motion.div>
                    <h3 className="font-bold text-3xl text-gray-900 dark:text-white mb-3">
                      Välkommen! 🎉
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Börja din läranderesa genom att lägga till ditt första studiematerial
                    </p>
                    <Button
                      onClick={() => setShowImportMenu(true)}
                      size="lg"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all"
                    >
                      <Plus size={24} className="mr-2" />
                      Lägg Till Material
                    </Button>

                    {/* Tips */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-2xl p-4 border border-pink-100 dark:border-pink-900/30">
                        <div className="text-3xl mb-2">📸</div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fotografera anteckningar</p>
                      </div>
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl p-4 border border-teal-100 dark:border-teal-900/30">
                        <div className="text-3xl mb-2">📄</div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ladda upp PDF-filer</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
                        <div className="text-3xl mb-2">✍️</div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Skriv egen text</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
