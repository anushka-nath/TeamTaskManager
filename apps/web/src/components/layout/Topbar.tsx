import { useAuth } from "@/hooks/useAuth";
import { LogOut, UserCircle } from "lucide-react";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
