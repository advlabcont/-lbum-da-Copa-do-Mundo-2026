import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Book, ShieldAlert, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

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
      setError(err.message || 'Erro ao fazer login com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
         setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
         setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
         setError(err.message || 'Erro ao autenticar.');
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

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors touch-manipulation"
                        placeholder="Seu nome"
                     />
                  </div>
               </div>
            )}

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors touch-manipulation"
                     placeholder="seu@email.com"
                  />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                     type="password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors touch-manipulation"
                     placeholder="••••••"
                  />
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] items-center"
            >
              {loading ? 'Aguarde...' : isRegistering ? 'Criar Conta' : 'Entrar com E-mail'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6">
               <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] items-center mb-4"
               >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuar com Google
               </button>
            </div>
            
            <div className="mt-4 text-center">
               <button 
                 type="button"
                 onClick={() => {
                   setIsRegistering(!isRegistering);
                   setError('');
                 }}
                 className="text-sm font-medium text-green-600 hover:text-green-500"
               >
                 {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
               </button>
            </div>
          </div>
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
