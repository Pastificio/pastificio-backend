import React, { useState } from 'react';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from './providers/ToastProvider';
import { Button } from './ui/button';
import { 
  Menu, 
  LogOut, 
  Settings, 
  Database, 
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigation = [
    { name: 'Ordini', href: '/ordini', icon: ClipboardList },
    { name: 'Backup', href: '/backup', icon: Database },
    { name: 'Configurazione', href: '/configurazione', icon: Settings },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AppProvider>
      <ToastProvider>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <aside 
            className={`
              bg-gray-800 
              text-white 
              ${sidebarOpen ? 'w-64' : 'w-20'} 
              transition-all 
              duration-300 
              ease-in-out
              fixed 
              h-full
              z-20
            `}
          >
            {/* Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
              {sidebarOpen && (
                <h1 className="text-xl font-bold truncate">
                  Pastificio Manager
                </h1>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-white hover:bg-gray-700"
              >
                {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
              </Button>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-2">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 mb-2 rounded-lg
                      transition-colors duration-200
                      ${currentPath === item.href 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                      }
                    `}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPath(item.href);
                      // Qui aggiungi la logica di navigazione
                    }}
                  >
                    <IconComponent className={`h-6 w-6 ${!sidebarOpen && 'mx-auto'}`} />
                    {sidebarOpen && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className={`
            flex-1 
            flex 
            flex-col 
            ${sidebarOpen ? 'ml-64' : 'ml-20'}
            transition-all 
            duration-300 
            ease-in-out
          `}>
            {/* Header */}
            <header className="h-16 bg-white border-b flex items-center justify-end px-6 sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Admin</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {sidebarOpen && "Logout"}
                </Button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AppProvider>
  );
};

export default Layout;