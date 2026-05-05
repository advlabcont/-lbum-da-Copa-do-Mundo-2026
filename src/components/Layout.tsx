import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Book, ArrowLeftRight } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 text-gray-900 font-sans w-full max-w-[100vw] overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Link to="/" className="flex items-center space-x-2 text-green-700 font-bold text-xl min-h-[44px]">
                <Book className="w-6 h-6 flex-shrink-0" />
                <span className="hidden sm:inline-block">Copa 2026</span>
              </Link>
              <nav className="hidden md:flex space-x-2">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center ${location.pathname === '/' || location.pathname.startsWith('/album') ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'}`}>
                  Meus Álbuns
                </Link>
                <Link to="/trades" className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center ${location.pathname === '/trades' ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'}`}>
                  Trocas
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline-block truncate max-w-[150px] lg:max-w-xs">
                Olá, {user?.displayName}
              </span>
              <button 
                onClick={handleLogout}
                className="p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center touch-manipulation"
                title="Sair"
                aria-label="Sair da conta"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 safe-area-pb z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/' || location.pathname.startsWith('/album') ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}`}>
            <Book className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Álbuns</span>
          </Link>
          <Link to="/trades" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/trades' ? 'text-green-700' : 'text-gray-500 hover:text-green-600'}`}>
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Trocas</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
