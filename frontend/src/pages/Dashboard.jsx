import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { clinicalTemplates } from "../lib/templates";
import { Plus, FileText, BarChart3, Share2, Trash2, Copy, Clock, ExternalLink, LogOut, LayoutDashboard, Settings, BookTemplate, Users } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [patients, setPatients] = useState([]);
  const [shareData, setShareData] = useState({
    patientId: "",
    expiresAt: ""
  });
  const [generatedLink, setGeneratedLink] = useState("");

  useEffect(() => {
    loadData();
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const formsData = await api.getForms();
      setForms(formsData);
      const statsMap = {};
      for (const form of formsData) {
        try {
          statsMap[form.id] = await api.getFormStats(form.id);
        } catch {
          statsMap[form.id] = { responseCount: 0, shareLinkCount: 0 };
        }
      }
      setStats(statsMap);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    try {
      await api.deleteForm(id);
      setForms(forms.filter((f) => f.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const newForm = await api.duplicateForm(id);
      setForms([newForm, ...forms]);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleImportTemplate = async (template) => {
    try {
      const newForm = await api.createForm({
        title: template.title,
        schema: template.schema
      });
      setForms([newForm, ...forms]);
      setShowTemplates(false);
    } catch (error) {
      alert("Failed to import template: " + error.message);
    }
  };

  const handleCreateShareLink = async (e) => {
    e.preventDefault();
    try {
      const result = await api.createShareLink({
        formId: selectedForm.id,
        patientId: shareData.patientId || undefined,
        expiresAt: shareData.expiresAt || undefined
      });
      // The backend returns a relative shareUrl, let's make it absolute for the UI
      const absoluteUrl = `${window.location.origin}/form/${result.token}`;
      setGeneratedLink(absoluteUrl);
    } catch (error) {
      alert("Failed to create link: " + error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResponses = Object.values(stats).reduce((sum, s) => sum + (s.responseCount || 0), 0);

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
                <Link to="/dashboard" className="btn btn-ghost text-sm bg-brand-100 text-brand-950">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link to="/patients" className="btn btn-ghost text-sm">
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<FileText size={20} />} label="Total Forms" value={forms.length} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<BarChart3 size={20} />} label="Total Responses" value={totalResponses} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<Share2 size={20} />} label="Active Links" value={Object.values(stats).reduce((s, st) => s + (st.shareLinkCount || 0), 0)} color="bg-purple-50 text-purple-600" />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-950">My Forms</h1>
            <p className="text-sm text-brand-500 mt-1">Create and manage your survey forms</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)} className="btn btn-secondary">
              <BookTemplate size={16} />
              Templates
            </button>
            <Link to="/forms/new" className="btn btn-primary">
              <Plus size={16} />
              New Form
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search forms..."
            className="input max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-5 bg-brand-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-brand-100 rounded w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-brand-100 rounded w-20" />
                  <div className="h-8 bg-brand-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="card p-16 text-center">
            <FileText size={48} className="mx-auto text-brand-300 mb-4" />
            <h3 className="text-lg font-medium text-brand-950 mb-2">
              {searchQuery ? "No forms found" : "No forms yet"}
            </h3>
            <p className="text-brand-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term" : "Create your first form to get started"}
            </p>
            {!searchQuery && (
              <Link to="/forms/new" className="btn btn-primary">
                <Plus size={16} />
                Create Form
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                stats={stats[form.id]}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onShare={() => {
                  setSelectedForm(form);
                  setShareData({ patientId: "", expiresAt: "" });
                  setShowShareModal(true);
                  setGeneratedLink("");
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-brand-950">Share Form</h2>
              <button onClick={() => setShowShareModal(false)} className="text-brand-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleCreateShareLink} className="space-y-4">
                <div className="p-3 bg-brand-50 rounded-lg border border-brand-100 mb-4">
                  <p className="text-xs text-brand-500 font-medium uppercase tracking-wider mb-1">Form</p>
                  <p className="text-sm font-semibold text-brand-950">{selectedForm?.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Assign to Patient (Optional)</label>
                  <select 
                    className="input"
                    value={shareData.patientId}
                    onChange={(e) => setShareData({ ...shareData, patientId: e.target.value })}
                  >
                    <option value="">Select a patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-brand-400 mt-1">Assignments allow responses to be automatically saved to the patient record.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Expiration Date (Optional)</label>
                  <input 
                    type="date" 
                    className="input"
                    value={shareData.expiresAt}
                    onChange={(e) => setShareData({ ...shareData, expiresAt: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4">
                  Generate Link
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Share2 size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-brand-950">Link Generated!</h3>
                  <p className="text-xs text-brand-500 mt-1">Copy and send this link to your patient.</p>
                </div>

                <div className="relative group">
                  <input 
                    readOnly 
                    className="input pr-20 bg-brand-50 font-mono text-xs"
                    value={generatedLink}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert("Link copied to clipboard!");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary py-1 px-3 text-[10px]"
                  >
                    Copy
                  </button>
                </div>

                <button 
                  onClick={() => setShowShareModal(false)}
                  className="btn btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/20 backdrop-blur-sm">
          <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-950">Clinical Templates</h2>
                <p className="text-sm text-brand-500">Professional models ready for use</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-brand-400 hover:text-brand-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {clinicalTemplates.map((template) => (
                <div key={template.id} className="card p-4 hover:border-brand-300 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-brand-950">{template.title}</h3>
                      <p className="text-sm text-brand-500 mt-1">{template.description}</p>
                    </div>
                    <button 
                      onClick={() => handleImportTemplate(template)}
                      className="btn btn-primary text-xs shrink-0"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-brand-100 bg-brand-50/50">
              <p className="text-xs text-brand-400 text-center">
                Imported templates can be fully customized in the Form Builder.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-950">{value}</p>
          <p className="text-xs text-brand-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FormCard({ form, stats, onDelete, onDuplicate, onShare }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = stats?.latestResponse ? `${window.location.origin}/share/${form.id}` : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-5 card-hover animate-fade-in group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/forms/${form.id}/edit`}
            className="text-base font-semibold text-brand-950 hover:text-brand-700 block truncate"
          >
            {form.title}
          </Link>
          <p className="text-xs text-brand-400 mt-1">
            Updated {new Date(form.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(form.id)}
            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100 transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onDelete(form.id)}
            className="p-1.5 rounded-lg text-brand-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-brand-500 mb-4">
        <span className="flex items-center gap-1">
          <BarChart3 size={12} />
          {stats?.responseCount || 0} responses
        </span>
        <span className="flex items-center gap-1">
          <Share2 size={12} />
          {stats?.shareLinkCount || 0} links
        </span>
      </div>

      <div className="flex gap-2">
        <Link to={`/forms/${form.id}/edit`} className="btn btn-secondary text-xs flex-1">
          <FileText size={14} />
          Edit
        </Link>
        <button onClick={onShare} className="btn btn-primary text-xs flex-1">
          <Share2 size={14} />
          Share
        </button>
        <Link to={`/forms/${form.id}/responses`} className="btn btn-ghost text-xs">
          <BarChart3 size={14} />
          Responses
        </Link>
      </div>
    </div>
  );
}
