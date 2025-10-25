import { useState } from 'react';
import { Upload, Check, Image as ImageIcon, Palette } from 'lucide-react';
import { Card } from '../common/Card';
import type { BackgroundSettings } from '../../types';

interface BackgroundSelectorProps {
  currentBackground?: BackgroundSettings;
  onBackgroundChange: (background: BackgroundSettings) => void;
}

const GRADIENTS = [
  { name: 'ocean', label: 'Ocean', gradient: 'from-blue-400 via-cyan-500 to-teal-400' },
  { name: 'sunset', label: 'Sunset', gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { name: 'forest', label: 'Forest', gradient: 'from-green-400 via-emerald-500 to-teal-500' },
  { name: 'lavender', label: 'Lavender', gradient: 'from-purple-400 via-pink-400 to-rose-400' },
  { name: 'fire', label: 'Fire', gradient: 'from-red-500 via-orange-500 to-yellow-400' },
  { name: 'night', label: 'Night', gradient: 'from-indigo-900 via-purple-900 to-pink-800' },
  { name: 'mint', label: 'Mint', gradient: 'from-emerald-300 via-teal-300 to-cyan-300' },
  { name: 'candy', label: 'Candy', gradient: 'from-pink-300 via-purple-300 to-indigo-400' },
  { name: 'autumn', label: 'Autumn', gradient: 'from-amber-500 via-orange-600 to-red-600' },
  { name: 'nordic', label: 'Nordic', gradient: 'from-slate-400 via-blue-300 to-cyan-200' },
];

const PRESET_IMAGES = [
  { name: 'space', label: 'Space', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80' },
  { name: 'nature', label: 'Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80' },
  { name: 'mountains', label: 'Mountains', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80' },
  { name: 'ocean-waves', label: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80' },
  { name: 'aurora', label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80' },
  { name: 'library', label: 'Library', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80' },
  { name: 'abstract', label: 'Abstract', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80' },
  { name: 'minimal', label: 'Minimal', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80' },
];

export function BackgroundSelector({ currentBackground, onBackgroundChange }: BackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<'gradient' | 'image' | 'custom'>('gradient');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleGradientSelect = (gradientName: string) => {
    onBackgroundChange({ type: 'gradient', value: gradientName });
  };

  const handleImageSelect = (imageUrl: string) => {
    onBackgroundChange({ type: 'image', value: imageUrl });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vänligen välj en bildfil');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bilden är för stor. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadPreview(base64String);
      onBackgroundChange({ type: 'custom', value: base64String });
    };
    reader.readAsDataURL(file);
  };

  const isSelected = (type: string, value: string) => {
    return currentBackground?.type === type && currentBackground?.value === value;
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bakgrund
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Anpassa bakgrunden på dina studiematerial för en mer personlig upplevelse!
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('gradient')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'gradient'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Palette className="inline-block h-4 w-4 mr-1" />
          Gradienter
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'image'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="inline-block h-4 w-4 mr-1" />
          Bilder
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Upload className="inline-block h-4 w-4 mr-1" />
          Ladda upp
        </button>
      </div>

      {/* Gradient Selection */}
      {activeTab === 'gradient' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {GRADIENTS.map((gradient) => (
            <button
              key={gradient.name}
              onClick={() => handleGradientSelect(gradient.name)}
              className="group relative"
            >
              <div
                className={`h-20 rounded-lg bg-gradient-to-br ${gradient.gradient} transition-all ${
                  isSelected('gradient', gradient.name)
                    ? 'ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'hover:ring-2 hover:ring-purple-300'
                }`}
              >
                {isSelected('gradient', gradient.name) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                {gradient.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Image Selection */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PRESET_IMAGES.map((image) => (
            <button
              key={image.name}
              onClick={() => handleImageSelect(image.url)}
              className="group relative"
            >
              <div
                className={`h-24 rounded-lg bg-cover bg-center transition-all ${
                  isSelected('image', image.url)
                    ? 'ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'hover:ring-2 hover:ring-purple-300'
                }`}
                style={{ backgroundImage: `url(${image.url})` }}
              >
                {isSelected('image', image.url) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                {image.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Custom Upload */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Klicka för att ladda upp
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG upp till 5MB
              </p>
            </div>
          </label>

          {(uploadPreview || (currentBackground?.type === 'custom' && currentBackground.value)) && (
            <div className="relative">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Förhandsgranskning:
              </p>
              <div
                className="h-32 rounded-lg bg-cover bg-center ring-2 ring-purple-500"
                style={{
                  backgroundImage: `url(${uploadPreview || currentBackground?.value})`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
