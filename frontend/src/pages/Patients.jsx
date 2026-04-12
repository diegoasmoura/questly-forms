import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  Trash2,
  Edit,
  LayoutDashboard,
  LogOut
} from "lucide-react";

export default function Patients() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    notes: ""
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(newPatient);
      setShowAddModal(false);
      setNewPatient({ name: "", email: "", phone: "", birthDate: "", notes: "" });
      loadPatients();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!confirm("Are you sure you want to delete this patient? All their history will be lost.")) return;
    try {
      await api.deletePatient(id);
      setPatients(patients.filter(p => p.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-brand-950 tracking-tight">
                curious
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/dashboard" className="btn btn-ghost text-sm">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link to="/patients" className="btn btn-ghost text-sm bg-brand-100 text-brand-950">
                  <Users size={16} />
                  Patients
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-brand-500">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-brand-950">{user?.name}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost text-sm" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-brand-950">Patients</h1>
            <p className="text-sm text-brand-500 mt-1">Manage your patients and their clinical history</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <UserPlus size={16} />
            Add Patient
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100" />
                  <div className="flex-1">
                    <div className="h-4 bg-brand-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-brand-50 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-brand-50 rounded w-full" />
                  <div className="h-3 bg-brand-50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-medium text-brand-950 mb-2">
              {searchQuery ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-brand-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term" : "Add your first patient to start tracking their progress"}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                <UserPlus size={16} />
                Add Patient
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onDelete={handleDeletePatient}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-brand-950">New Patient</h2>
              <button onClick={() => setShowAddModal(false)} className="text-brand-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={newPatient.email}
                    onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  className="input"
                  value={newPatient.birthDate}
                  onChange={e => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Notes</label>
                <textarea
                  className="input min-h-[100px]"
                  value={newPatient.notes}
                  onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })}
                  placeholder="Clinical observations, background, etc."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, onDelete }) {
  return (
    <div className="card p-5 card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-lg">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-brand-950 group-hover:text-brand-700 transition-colors">
              {patient.name}
            </h3>
            <p className="text-xs text-brand-400">
              Joined {new Date(patient.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(patient.id)}
            className="p-1.5 rounded-lg text-brand-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {patient.email && (
          <div className="flex items-center gap-2 text-xs text-brand-500">
            <Mail size={14} className="text-brand-300" />
            {patient.email}
          </div>
        )}
        {patient.phone && (
          <div className="flex items-center gap-2 text-xs text-brand-500">
            <Phone size={14} className="text-brand-300" />
            {patient.phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-brand-500">
          <FileText size={14} className="text-brand-300" />
          {patient._count.responses} responses collected
        </div>
      </div>

      <Link
        to={`/patients/${patient.id}`}
        className="btn btn-secondary w-full text-xs justify-between group/btn"
      >
        View Medical Record
        <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
