import { useAuth } from "@/hooks/useAuth";
import { LogOut, UserCircle, Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 text-gray-600 hover:text-gray-900"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 hidden sm:inline">{user?.name}</span>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
