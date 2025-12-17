"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Search, 
  Loader2, 
  UserCircle,
  MoreVertical,
  X
} from "lucide-react";

interface User {
  _id: string;
  userName: string;
  email: string;
  isAdmin: boolean;
  provider: string;
  createdAt?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/getUsers");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/updateUsers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });

      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isAdmin: !currentStatus } : u));
      } else {
        alert("Failed to update user privileges");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this account? This action cannot be undone.")) return;

    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/updateUsers/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* SECTION 1: HEADER & STATS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-gray-800 flex items-center gap-3">
              <Users size={20} className="text-indigo-600" />
              User Management
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
              Manage permissions and monitor authentication providers
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full md:w-80 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* STATS BOXES ON TOP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-200 transition-colors">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admins</p>
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isAdmin).length}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: USERS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">User Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Provider</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <UserCircle size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.userName || "Unnamed User"}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={12} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter border ${
                      user.provider === 'google' 
                      ? 'bg-blue-50 border-blue-100 text-blue-600' 
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                      {user.provider || 'credentials'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAdminStatus(user._id, user.isAdmin)}
                      disabled={processingId === user._id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        user.isAdmin 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {processingId === user._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : user.isAdmin ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <ShieldAlert size={14} />
                      )}
                      {user.isAdmin ? "Admin" : "Customer"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteUser(user._id)}
                      disabled={processingId === user._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                      title="Delete User"
                    >
                      {processingId === user._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-20 text-center">
            <Users size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-sm text-gray-500 font-medium">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}