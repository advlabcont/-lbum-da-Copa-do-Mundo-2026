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
      console.log("Starting Google Login...");
      await loginWithGoogle();
      console.log("Login successful");
    } catch (err: any) {
      console.error("Login error details:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O login com o Google foi cancelado.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou o popup de login. Verifique se o seu navegador permite janelas popup ou tente abrir o site em uma nova aba fora do editor.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado para login. Por favor, use a URL oficial ou reporte este problema.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError(`Erro ao fazer login: ${err.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-green-700 p-4 rounded-full text-yellow-400 border-4 border-yellow-400 shadow-md">
            <Book className="w-12 h-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-green-900 tracking-tight uppercase">
          Álbum Copa 2026
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-green-800">
          Gerencie e compartilhe suas figurinhas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-yellow-300">
          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md flex items-center space-x-3 text-red-700">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-green-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] items-center"
          >
            {loading ? 'Entrando...' : 'Entrar com o Google'}
          </button>
        </div>

        {/* Rodapé - Créditos e Versículo */}
        <div className="mt-12 text-center px-4">
          <div className="text-sm text-green-800 space-y-1.5 font-medium">
            <p className="font-bold text-green-900 leading-relaxed uppercase tracking-wider text-xs">Elaborado por Anderson Daniel</p>
            <p>
              <a href="mailto:adanv.vieira@gmail.com" className="hover:text-green-600 transition-colors">adanv.vieira@gmail.com</a>
            </p>
            <p>
              <a href="https://instagram.com/anderson.vieira.contabil" target="_blank" rel="noreferrer" className="hover:text-green-600 transition-colors">Instagram - @anderson.vieira.contabil</a>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-yellow-300 max-w-sm mx-auto">
            <p className="italic text-green-800 text-[15px] leading-relaxed font-serif">
              "Assim, quer vocês comam, quer bebam, quer façam qualquer outra coisa, façam tudo para a glória de Deus."
            </p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-green-900 bg-yellow-200 w-fit mx-auto px-2 py-1 rounded">
              1 Coríntios 10:31
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
