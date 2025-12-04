import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Package,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CreatePackageModal } from '../../components/motion-learn/CreatePackageModal';
import type { WordPackage, WordPair } from '../../types/motion-learn';
import {
  getAllPackages,
  deletePackage,
  createPackage,
} from '../../services/wordPackageService';

export function AdminPage() {
  const [packages, setPackages] = useState<WordPackage[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = () => {
    setPackages(getAllPackages());
  };

  const handleCreatePackage = (name: string, words: WordPair[]) => {
    createPackage(name, words);
    loadPackages();
  };

  const handleDeletePackage = (id: string, name: string) => {
    if (confirm(`Är du säker på att du vill ta bort "${name}"?`)) {
      deletePackage(id);
      loadPackages();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/motion-learn">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till Hub
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Package className="h-10 w-10 text-purple-500" />
                Ordpaket
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Hantera dina ordpaket för spelen
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Nytt Paket
              </Button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {packages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center">
                  <Package className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Inga ordpaket än
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Skapa ditt första ordpaket för att börja spela och lära dig
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowCreateModal(true)} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Skapa Nytt Paket
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Package List */}
        {packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pkg.words.length} ord
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                      <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>

                  <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Senast uppdaterad
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(pkg.updatedAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => alert('Redigering kommer snart!')}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Redigera
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  Tips för ordpaket
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Alla ordpaket sparas lokalt i din webbläsare (GDPR-säkert)</li>
                  <li>• Du kan importera ord i bulk från textfiler</li>
                  <li>• Formatexempel: "cat,katt" eller "dog:hund"</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Create Package Modal */}
      <CreatePackageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePackage}
      />
    </div>
  );
}
