import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Book, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao fazer login com o Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-green-700 p-4 rounded-full text-white">
            <Book className="w-12 h-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Álbum Copa 2026
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gerencie e compartilhe suas figurinhas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md flex items-center space-x-3 text-red-700">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar com o Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
