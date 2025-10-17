import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Chrome, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Starting email login');
      const userProfile = await signInWithEmail(email, password);
      console.log('Login successful, user profile:', userProfile);
      // Don't navigate - let App.tsx handle routing based on auth state
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Fel vid inloggning');
      setIsLoading(false);
    }
    // Don't set isLoading to false on success - let the auth state change handle it
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginPage] Starting Google login');
      const userProfile = await signInWithGoogle();
      console.log('[LoginPage] Google login successful, user profile:', userProfile);
      // Wait a bit for Firestore to sync before auth state triggers
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[LoginPage] Ready for auth state change');
      // Don't navigate - let App.tsx handle routing based on auth state
    } catch (err: any) {
      console.error('[LoginPage] Google login error:', err);
      setError(err.message || 'Fel vid Google-inloggning');
      setIsLoading(false);
    }
    // Don't set isLoading to false on success - let the auth state change handle it
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4"
          >
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Välkommen tillbaka!
          </h1>
          <p className="text-white/90">
            Logga in för att fortsätta lära dig
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign In */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm mb-6 px-4 py-3 rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="mr-3 h-5 w-5 text-gray-700" />
              <span className="text-gray-700">Fortsätt med Google</span>
            </button>
          </motion.div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Eller med email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="din@email.se"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Logga in
              </Button>
            </motion.div>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Har du inget konto?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Skapa konto
            </Link>
          </p>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/80">
          Genom att fortsätta godkänner du våra användarvillkor
        </p>
      </motion.div>
    </div>
  );
}
