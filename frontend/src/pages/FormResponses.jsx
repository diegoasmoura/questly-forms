import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { exportToPdf } from "../lib/pdf";
import { ArrowLeft, Download, Filter, Trash2, Eye, Calendar, FileDown } from "lucide-react";

export default function FormResponses() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [formData, responsesData, aggregateData] = await Promise.all([
        api.getForm(id),
        api.getResponses(id),
        api.getAggregate(id),
      ]);
      setForm(formData);
      setResponses(responsesData);
      setAggregate(aggregateData);
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (responseId) => {
    if (!confirm("Delete this response?")) return;
    try {
      await api.deleteResponse(responseId);
      setResponses(responses.filter((r) => r.id !== responseId));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExportCSV = () => {
    if (!responses.length) return;
    const headers = Object.keys(responses[0].data);
    const csv = [
      ["Response ID", "Date", ...headers].join(","),
      ...responses.map((r) => [
        r.id,
        new Date(r.createdAt).toISOString(),
        ...headers.map((h) => JSON.stringify(r.data[h] || "")),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form?.title || "responses"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = (response) => {
    try {
      const fileName = `${form?.title || "Survey"}_${new Date(response.createdAt).toISOString().split('T')[0]}.pdf`;
      exportToPdf(form.schema, response.data, fileName);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="animate-pulse text-brand-500">Loading responses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base font-semibold text-brand-950">{form?.title}</h1>
              <p className="text-xs text-brand-400">Responses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aggregate && (
              <span className="text-sm text-brand-500">
                {aggregate.total} responses
              </span>
            )}
            <button onClick={handleExportCSV} className="btn btn-secondary text-sm">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {aggregate && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatBox label="Total" value={aggregate.total} />
            <StatBox label="Today" value={aggregate.todayCount} />
            <StatBox label="This Week" value={aggregate.weekCount} />
          </div>
        )}

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="card p-16 text-center">
            <Filter size={48} className="mx-auto text-brand-300 mb-4" />
            <h3 className="text-lg font-medium text-brand-950 mb-2">No responses yet</h3>
            <p className="text-brand-500 max-w-sm mx-auto">
              Share your form with patients to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => (
              <div key={response.id} className="card p-4 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedResponse(selectedResponse?.id === response.id ? null : response)}
                      className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400"
                      title="View data"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleExportPdf(response)}
                      className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 hover:text-brand-950"
                      title="Export to PDF"
                    >
                      <FileDown size={16} />
                    </button>
                    <span className="text-sm text-brand-400">
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(response.createdAt).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(response.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-brand-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Quick preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(response.data).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-brand-400 block truncate">{key}</span>
                      <span className="text-brand-700 font-medium truncate block">
                        {typeof value === "object" ? JSON.stringify(value) : String(value).slice(0, 30)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expanded view */}
                {selectedResponse?.id === response.id && (
                  <div className="mt-4 pt-4 border-t border-brand-100 animate-fade-in">
                    <pre className="text-xs text-brand-600 bg-brand-50 p-4 rounded-lg overflow-auto max-h-64">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-bold text-brand-950">{value}</p>
      <p className="text-xs text-brand-500">{label}</p>
    </div>
  );
}
