import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { api } from "../../services/api";
import type { User, DairyProfile, Center } from "../../types/models";

const Settings: React.FC = () => {
  const { currentSuperAdminId, setCurrentSuperAdminId } = useAppContext();
  const [superAdminIdInput, setSuperAdminIdInput] = useState(currentSuperAdminId);

  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dairyProfile, setDairyProfile] = useState<DairyProfile>({
    dairyName: "",
    gstin: "",
    address: ""
  });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const loadSettingsData = async () => {
      setIsLoading(true);
      try {
        const [loadedUsers, loadedCenters, loadedProfile] = await Promise.all([
          api.getUsers(),
          api.getCenters(),
          api.getDairyProfile()
        ]);
        setUsers(loadedUsers);
        setCenters(loadedCenters);
        if (loadedProfile) {
          setDairyProfile(loadedProfile);
        }
      } catch (e) {
        console.error("Failed to load settings data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettingsData();
  }, []);

  const handleSaveProfile = async () => {
    await api.saveDairyProfile(dairyProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: "Super Admin" | "Manager";
    assignedCenters: string[];
  }>({
    name: "",
    email: "",
    role: "Manager",
    assignedCenters: ["All Centers"]
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const avatarGradient = newUser.role === "Super Admin"
      ? "from-purple-500 to-purple-600"
      : "from-blue-500 to-blue-600";

    const newUserRecord: User = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      assignedCenters: newUser.assignedCenters,
      avatarClass: avatarGradient,
    };

    await api.createUser(newUserRecord);
    setUsers([...users, newUserRecord]);

    setShowUserModal(false);
    setNewUser({ name: "", email: "", role: "Manager", assignedCenters: ["All Centers"] });
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm("Remove this user?")) {
      await api.deleteUser(email);
      setUsers(users.filter(u => u.email !== email));
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Settings &amp; Access Control
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Configure system settings and manage user permissions
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="card p-5 lg:col-span-2 bg-white shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">
              User Roles &amp; Permissions
            </h3>
            <button
              type="button"
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </button>
          </div>
          <div className="space-y-4">
            {users.length === 0 && !isLoading && (
              <p className="text-slate-500 text-sm py-4 text-center">No users found.</p>
            )}
            {users.map((user) => {
              const roleDisplay = user.role;
              const roleClass = user.role === "Super Admin" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700";
              const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
              const avatarClass = user.avatarClass || (user.role === "Super Admin" ? "from-purple-500 to-purple-600" : "from-blue-500 to-blue-600");

              return (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarClass} flex items-center justify-center text-white font-semibold text-sm shrink-0`}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${roleClass}`}
                    >
                      {roleDisplay}
                    </span>
                    <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white flex-1 max-w-[150px] truncate">
                      <option>All Centers</option>
                      {centers.map(c => (
                        <option key={c.id}>{c.dairyName}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleDeleteUser(user.email)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                      title="Remove User"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5 bg-white shadow-sm rounded-2xl">
            <h3 className="font-semibold text-slate-800 mb-4">Dairy Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Dairy Name
                </label>
                <input
                  type="text"
                  value={dairyProfile.dairyName}
                  onChange={(e) => setDairyProfile({ ...dairyProfile, dairyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={dairyProfile.gstin}
                  onChange={(e) => setDairyProfile({ ...dairyProfile, gstin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={dairyProfile.address}
                  onChange={(e) => setDairyProfile({ ...dairyProfile, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="pt-2 flex items-center justify-between">
                {profileSaved ? (
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    Saved!
                  </span>
                ) : (
                  <span></span>
                )}
                <button
                  onClick={() => void handleSaveProfile()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white shadow-sm rounded-2xl">
            <h3 className="font-semibold text-slate-800 mb-4">App Context</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Super Admin ID
                </label>
                <input
                  type="text"
                  value={superAdminIdInput}
                  onChange={(event) => setSuperAdminIdInput(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-3"
                />
                <button
                  type="button"
                  onClick={() => setCurrentSuperAdminId(superAdminIdInput)}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition"
                >
                  Update Admin Context
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Used in system tracking when creating new centers.
              </p>
            </div>
          </div>

          <div className="card p-5 bg-white shadow-sm rounded-2xl">
            <h3 className="font-semibold text-slate-800 mb-4">
              Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600">Quality Alerts</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600">Daily Reports</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600">Rate Changes</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Add New User</h3>
            <form onSubmit={(e) => { void handleAddUser(e); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Amit Patel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="amit@dairypro.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value as "Super Admin" | "Manager" })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Assigned Center</label>
                  <select
                    value={newUser.assignedCenters[0] || "All Centers"}
                    onChange={e => setNewUser({ ...newUser, assignedCenters: [e.target.value] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="All Centers">All Centers</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.dairyName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
