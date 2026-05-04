import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Book, RefreshCw } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 text-green-700 font-bold text-xl">
                <Book className="w-6 h-6" />
                <span>Copa 2026 Album</span>
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                  Meus Álbuns
                </Link>
                <Link to="/trades" className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium">
                  Trocas
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden sm:inline-block">
                Olá, {user?.displayName}
              </span>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
