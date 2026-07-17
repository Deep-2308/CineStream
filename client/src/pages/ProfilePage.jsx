import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { interactionApi } from '../services/interactionApi.js';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/ui/Button.jsx';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'Thriller',
  'Western', 'Family', 'History', 'War'
];

const DECADES = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Japanese', 'Korean', 'Hindi'];

export default function ProfilePage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    favoriteGenres: [],
    favoriteLanguage: '',
    favoriteDecade: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        favoriteGenres: user.preferences?.favoriteGenres || [],
        favoriteLanguage: user.preferences?.favoriteLanguage || '',
        favoriteDecade: user.preferences?.favoriteDecade || ''
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data) => interactionApi.updateProfile(data),
    onSuccess: (data) => {
      // Update auth store in place so Navbar updates immediately
      setAuth(accessToken, data.user);
    }
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleGenre = (genre) => {
    setFormData(prev => {
      const isSelected = prev.favoriteGenres.includes(genre);
      const newGenres = isSelected
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre];
      return { ...prev, favoriteGenres: newGenres };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      name: formData.name,
      preferences: {
        favoriteGenres: formData.favoriteGenres,
        favoriteLanguage: formData.favoriteLanguage,
        favoriteDecade: formData.favoriteDecade
      }
    });
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="mb-8 text-3xl font-bold text-txt">Profile Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Read-only email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-txt-muted">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-md border border-surface bg-surface-light px-4 py-2 text-txt-muted opacity-60"
            />
            <p className="mt-1 text-xs text-txt-muted">Email cannot be changed.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-txt-muted">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={mutation.isPending}
              className="w-full rounded-md border border-surface bg-surface px-4 py-2 text-txt focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-txt-muted">Favorite Genres</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    formData.favoriteGenres.includes(genre)
                      ? 'border-primary bg-primary text-white'
                      : 'border-surface bg-surface text-txt-muted hover:border-txt-muted'
                  } ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-txt-muted">Favorite Language</label>
              <select
                name="favoriteLanguage"
                value={formData.favoriteLanguage}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="w-full rounded-md border border-surface bg-surface px-4 py-2 text-txt focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">No preference</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-txt-muted">Favorite Decade</label>
              <select
                name="favoriteDecade"
                value={formData.favoriteDecade}
                onChange={handleChange}
                disabled={mutation.isPending}
                className="w-full rounded-md border border-surface bg-surface px-4 py-2 text-txt focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">No preference</option>
                {DECADES.map(decade => (
                  <option key={decade} value={decade}>{decade}</option>
                ))}
              </select>
            </div>
          </div>

          {mutation.isError && (
            <div className="rounded-md bg-error/10 p-4 text-sm text-error border border-error/20">
              Failed to update profile. Please try again.
            </div>
          )}

          {mutation.isSuccess && (
            <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-500 border border-green-500/20">
              Profile updated successfully.
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
