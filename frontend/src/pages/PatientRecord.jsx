import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { exportToPdf } from "../lib/pdf";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit,
  LayoutDashboard,
  Users,
  LogOut,
  AlertCircle,
  FileDown
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const data = await api.getPatient(id);
      setPatient(data);
    } catch (error) {
      console.error("Failed to load patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExportPdf = (response) => {
    try {
      const fileName = `${patient.name}_${response.form.title}_${new Date(response.createdAt).toISOString().split('T')[0]}.pdf`;
      // We need the form schema. In the patient route, we are including the response.form, 
      // but let's make sure the backend returns the schema in the patient details.
      if (!response.form.schema) {
        throw new Error("Form schema not found. Cannot export PDF.");
      }
      exportToPdf(response.form.schema, response.data, fileName);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="animate-pulse text-brand-500">Loading medical record...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-brand-300 mb-4" />
          <h2 className="text-xl font-semibold text-brand-950">Patient not found</h2>
          <Link to="/patients" className="btn btn-primary mt-4">Back to Patients</Link>
        </div>
      </div>
    );
  }

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
              <button onClick={handleLogout} className="btn btn-ghost text-sm" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-700 mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Patients
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Patient Profile */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-3xl mb-4">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-2xl font-bold text-brand-950">{patient.name}</h1>
                <p className="text-sm text-brand-500">Medical Record: #{patient.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-brand-100">
                <InfoItem icon={<Mail size={16} />} label="Email" value={patient.email || "Not provided"} />
                <InfoItem icon={<Phone size={16} />} label="Phone" value={patient.phone || "Not provided"} />
                <InfoItem
                  icon={<Calendar size={16} />}
                  label="Birth Date"
                  value={patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "Not provided"}
                />
                <InfoItem
                  icon={<Clock size={16} />}
                  label="Patient Since"
                  value={new Date(patient.createdAt).toLocaleDateString()}
                />
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-brand-950 mb-4 flex items-center gap-2">
                <Edit size={16} />
                Clinical Notes
              </h3>
              <p className="text-sm text-brand-600 whitespace-pre-wrap leading-relaxed">
                {patient.notes || "No notes available for this patient."}
              </p>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-brand-950">Clinical History</h2>
              <span className="text-sm text-brand-500">{patient.responses.length} total entries</span>
            </div>

            {patient.responses.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText size={48} className="mx-auto text-brand-200 mb-4" />
                <h3 className="text-lg font-medium text-brand-950 mb-2">No history yet</h3>
                <p className="text-brand-500">Send a form to this patient to start building their medical record.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patient.responses.map((response) => (
                  <div key={response.id} className="card overflow-hidden">
                    <div
                      className="w-full flex items-center justify-between p-4 hover:bg-brand-50 transition-colors text-left"
                    >
                      <button 
                        onClick={() => setSelectedResponse(selectedResponse === response.id ? null : response.id)}
                        className="flex items-center gap-4 flex-1"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-950">{response.form.title}</h4>
                          <p className="text-xs text-brand-400">
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-2 px-4">
                        <button
                          onClick={() => handleExportPdf(response)}
                          className="p-2 rounded-lg hover:bg-brand-100 text-brand-400 hover:text-brand-950 transition-colors"
                          title="Export PDF"
                        >
                          <FileDown size={18} />
                        </button>
                        <ChevronRight
                          size={18}
                          className={`text-brand-300 transition-transform ${selectedResponse === response.id ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {selectedResponse === response.id && (
                      <div className="p-4 bg-brand-50 border-t border-brand-100 animate-fade-in">
                        <div className="bg-white rounded-lg p-4 border border-brand-100">
                          <h5 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-4">Response Data</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(response.data).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <span className="text-xs text-brand-400 font-medium">{key}</span>
                                <div className="text-sm text-brand-950 font-medium bg-brand-50/50 p-2 rounded">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-brand-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-brand-950 font-medium">{value}</p>
      </div>
    </div>
  );
}
