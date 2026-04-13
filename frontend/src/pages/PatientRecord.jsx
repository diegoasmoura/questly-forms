import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { generatePremiumSummary } from "../lib/pdf";
import { scoreTest } from "../lib/scoring";
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
  FileDown,
  Activity,
  AlertTriangle,
  Search,
  BookOpen
} from "lucide-react";

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleExportPremium = (response) => {
    try {
      generatePremiumSummary(patient, response);
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleResponse = (e, responseId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedResponseId(selectedResponseId === responseId ? null : responseId);
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
                      className="w-full flex items-center justify-between p-4 hover:bg-brand-50 transition-colors cursor-pointer"
                      onClick={(e) => toggleResponse(e, response.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-950">{response.form.title}</h4>
                          <p className="text-xs text-brand-400">
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPremium(response);
                          }}
                          className="btn btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-2 border-brand-200 hover:border-brand-950 transition-all"
                          title="Premium Summary PDF"
                        >
                          <BookOpen size={14} />
                          Resumo Premium
                        </button>
                        <ChevronRight
                          size={18}
                          className={`text-brand-300 transition-transform duration-300 ${selectedResponseId === response.id ? 'rotate-90 text-brand-950' : ''}`}
                        />
                      </div>
                    </div>

                    {selectedResponseId === response.id && (
                      <div className="p-4 bg-brand-50 border-t border-brand-100 animate-fade-in max-h-[700px] overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-brand-50 pb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={14} />
                            <input 
                              type="text" 
                              placeholder="Pesquisar nas respostas..."
                              className="input pl-10 text-xs py-2 bg-white"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Clinical Insight Card (Optional) */}
                        {(() => {
                          const result = scoreTest(null, response.data);
                          if (result.type === "clinical" && !searchTerm) {
                            return (
                              <div className={`mb-4 p-5 rounded-xl border-2 bg-white shadow-sm`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-brand-950" />
                                    <h5 className="font-bold text-xs uppercase tracking-widest text-brand-950">{result.title}</h5>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${result.color}`}>
                                    {result.severity}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-4xl font-bold text-brand-950">{result.score}</span>
                                  <span className="text-sm text-brand-400 font-medium">de {result.maxScore} pontos</span>
                                </div>
                                {result.alert && (
                                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-600 text-white text-xs font-bold mb-4 shadow-lg shadow-red-200 animate-pulse">
                                    <AlertTriangle size={16} />
                                    {result.alert}
                                  </div>
                                )}
                                <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                                  <p className="text-sm text-brand-700 leading-relaxed italic">"{result.interpretation}"</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="bg-white rounded-lg p-4 border border-brand-100">
                          <h5 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">Detalhamento das Respostas</h5>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(response.data)
                              .filter(([key, value]) => 
                                key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map(([key, value]) => (
                                <div key={key} className="flex items-start gap-4 p-3 rounded-lg hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100 group">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-brand-400 font-bold uppercase tracking-tight block mb-1 group-hover:text-brand-950 transition-colors">
                                      {key.replace(/_/g, ' ')}
                                    </span>
                                    <div className="text-sm text-brand-950 font-medium">
                                      {typeof value === "object" 
                                        ? <pre className="text-xs bg-brand-50 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                                        : String(value)
                                      }
                                    </div>
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
