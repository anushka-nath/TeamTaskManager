import { useState } from "react";
import { UserCircle, X, Shield, User } from "lucide-react";
import { useInviteMember, useRemoveMember, useUpdateMemberRole } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface MemberListProps {
  projectId: string;
  members: Member[];
  isAdmin: boolean;
}

export function MemberList({ projectId, members, isAdmin }: MemberListProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState("");

  const invite = useInviteMember();
  const remove = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await invite.mutateAsync({ projectId, data: { email: inviteEmail, role: inviteRole } });
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invite failed");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from the project?")) return;
    try {
      await remove.mutateAsync({ projectId, userId });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Remove failed");
    }
  }

  async function handleRoleChange(userId: string, newRole: "ADMIN" | "MEMBER") {
    try {
      await updateRole.mutateAsync({ projectId, userId, role: newRole });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Role update failed");
    }
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Invite Member</h3>
          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Invite
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value as "ADMIN" | "MEMBER")}
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500",
                      member.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                  <button
                    onClick={() => handleRemove(member.user.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove member"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    member.role === "ADMIN"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-gray-50 text-gray-700"
                  )}
                >
                  {member.role === "ADMIN" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
