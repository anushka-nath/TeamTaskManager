import { useAuth } from "@/hooks/useAuth";
import { UserCircle, Mail } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-gray-500 mt-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
