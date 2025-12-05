import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Sparkles, Package, TrendingUp, Zap, Camera, Target, Shield, Download, Check, Loader2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getAllPackages, getAllSessions, getAllHighScores, importPackageFromCloud } from '../../services/wordPackageService';

export function MotionLearnHub() {
  const [packageCount, setPackageCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // Import State
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    // Load stats from localStorage
    const packages = getAllPackages();
    const sessions = getAllSessions();
    const highscores = getAllHighScores();

    setPackageCount(packages.length);
    setSessionCount(sessions.length);

    // Get best score across all games
    const maxScore = highscores.reduce((max, hs) => Math.max(max, hs.score), 0);
    setBestScore(maxScore);
  };

  const handleImportPackage = async () => {
    if (!importCode || importCode.length !== 6) return;

    setIsImporting(true);
    setImportStatus('idle');

    const pkg = await importPackageFromCloud(importCode);

    setIsImporting(false);
    if (pkg) {
      setImportStatus('success');
      setImportCode('');
      loadStats(); // Reload stats to show new package count
      setTimeout(() => setImportStatus('idle'), 3000);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Hero Image Container */}
          <div className="relative w-full max-w-5xl mx-auto mb-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/10">
            <img
              src="/images/smartmoves-hero.png"
              alt="SmartMoves"
              className="w-full h-auto object-cover"
            />

            {/* Overlay Gradient for Text Readability if needed, or just aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

            {/* Text Overlay - Positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-left">
              <p className="text-xl md:text-2xl text-white font-medium max-w-3xl leading-relaxed drop-shadow-lg">
                Lär dig genom rörelse! Använd din kamera och kropp för att interagera med spel som tränar begrepp, glosor och mycket mer.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <Link to="/motion-learn/admin">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-500/30 transform hover:scale-105 transition-all text-lg px-8 py-4 h-auto rounded-2xl border-2 border-white/20"
              >
                <Package className="mr-3 h-8 w-8" />
                <div className="text-left">
                  <div className="font-bold text-xl">Hantera Ordpaket</div>
                  <div className="text-sm opacity-90 font-normal">Skapa & Redigera dina spel</div>
                </div>
              </Button>
            </Link>

            <Link to="/motion-learn/demo">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-lg text-lg px-8 py-4 h-auto rounded-2xl"
              >
                <Camera className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Testa Handspårning</div>
                  <div className="text-sm opacity-70 font-normal">Kontrollera din kamera</div>
                </div>
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Import Section (New) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-blue-200 dark:border-blue-800 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  Har du en kod?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Importera ett ordpaket direkt för att börja spela
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="KOD (t.ex. A7X92B)"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono uppercase tracking-wider w-full md:w-48 text-center md:text-left"
                />
                <Button
                  onClick={handleImportPackage}
                  disabled={isImporting || importCode.length !== 6}
                  className={`min-w-[120px] ${importStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : importStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {isImporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : importStatus === 'success' ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Klart!
                    </>
                  ) : importStatus === 'error' ? (
                    'Fel kod'
                  ) : (
                    'Hämta'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="p-6 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-gray-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{packageCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ordpaket</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-pink-200 bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/50 dark:to-gray-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/40">
                <Gamepad2 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{sessionCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Spelsessioner</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-gray-900">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{bestScore}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bästa poäng</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-purple-500" />
              Tillgängliga Spel
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Välj ett spel för att börja lära dig genom rörelse
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ordregn Game Card */}
            <Link to="/motion-learn/ordregn">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Card className="p-6 border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-semibold">
                      LIVE
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Ordregn
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Fånga fallande ord med dina händer! Rörelsebaserat glossspel där du tränar översättningar i realtid.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-xs font-medium text-purple-700 dark:text-purple-300">
                      Handspårning
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-xs font-medium text-pink-700 dark:text-pink-300">
                      Realtid
                    </span>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Spela Nu
                  </Button>
                </Card>
              </motion.div>
            </Link>

            {/* Whack-a-Word Game Card */}
            <Link to="/motion-learn/whack">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Card className="p-6 border-2 border-transparent hover:border-yellow-300 dark:hover:border-yellow-700 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:shadow-lg group-hover:shadow-yellow-500/50 transition-shadow">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-semibold">
                      NYHET
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Whack-a-Word
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Slå på rätt ord när de dyker upp! Snabba reflexer tränar ditt ordförråd.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-xs font-medium text-yellow-700 dark:text-yellow-300">
                      Geststyrning
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-xs font-medium text-orange-700 dark:text-orange-300">
                      Reaktion
                    </span>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold">
                    Spela Nu
                  </Button>
                </Card>
              </motion.div>
            </Link>

            {/* Goal Keeper Game Card */}
            <Link to="/motion-learn/goalkeeper">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Card className="p-6 border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 group-hover:shadow-lg group-hover:shadow-green-500/50 transition-shadow">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs font-semibold">
                      NYHET
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Goal Keeper
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Agera målvakt och rädda rätt begrepp! Använd hela kroppen för att blockera bollarna.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/40 text-xs font-medium text-green-700 dark:text-green-300">
                      Helkropp
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Fokus
                    </span>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold">
                    Spela Nu
                  </Button>
                </Card>
              </motion.div>
            </Link>

            <Card className="p-6 opacity-60 cursor-not-allowed">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-800">
                  <Gamepad2 className="h-8 w-8 text-gray-500" />
                </div>
                <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs font-semibold">
                  KOMMER SNART
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Motion Runner
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Spring och hoppa för att samla rätt ord! Ett dynamiskt plattformsspel.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Hur fungerar det?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl mb-3">📦</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">1. Skapa ordpaket</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Lägg till dina egna glosor eller begrepp som du vill träna på
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🎮</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">2. Välj ett spel</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Starta ett av våra rörelsebaserade spel och ge kameran tillgång
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🏆</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">3. Lär genom rörelse</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Använd din kropp för att interagera och lära dig på ett roligt sätt
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
