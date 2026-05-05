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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show a scary error
        setError('O login com o Google foi cancelado.');
      } else {
        setError(err.message || 'Erro ao fazer login com o Google.');
      }
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
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] items-center"
          >
            {loading ? 'Entrando...' : 'Entrar com o Google'}
          </button>
        </div>

        {/* Rodapé - Créditos e Versículo */}
        <div className="mt-12 text-center px-4">
          <div className="text-sm text-gray-600 space-y-1.5">
            <p className="font-medium text-gray-800">Elaborado por Anderson Daniel</p>
            <p>
              <a href="mailto:adanv.vieira@gmail.com" className="hover:text-green-700 transition-colors">adanv.vieira@gmail.com</a>
            </p>
            <p>
              <a href="https://instagram.com/anderson.vieira.contabil" target="_blank" rel="noreferrer" className="hover:text-green-700 transition-colors">Instagram - @anderson.vieira.contabil</a>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-green-200/50 max-w-sm mx-auto">
            <p className="italic text-gray-600 text-[15px] leading-relaxed">
              "Assim, quer vocês comam, quer bebam, quer façam qualquer outra coisa, façam tudo para a glória de Deus."
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-green-800">
              1 Coríntios 10:31
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
