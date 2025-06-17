import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Users, BookOpen, Settings, LogOut, Video } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({ isExpanded, setIsExpanded }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Classes', href: '/dashboard/classes', icon: BookOpen },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        "bg-gray-900 text-white flex flex-col h-full py-6 fixed left-0 top-0 transition-all duration-300 ease-in-out overflow-hidden z-40",
        isExpanded ? "w-64 px-4" : "w-20 px-2"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={cn("mb-8", isExpanded ? "text-left" : "text-center")}>
        <h2 className={cn("text-2xl font-bold text-blue-400", !isExpanded && "hidden")}>CodeCrew</h2>
        <h2 className={cn("text-2xl font-bold text-blue-400", isExpanded && "hidden")}>CC</h2>
      </div>
      
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname.startsWith(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  !isExpanded && "justify-center space-x-0"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout button at the bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
            'text-red-400 hover:bg-red-600 hover:text-white',
            !isExpanded && "justify-center space-x-0"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
} 