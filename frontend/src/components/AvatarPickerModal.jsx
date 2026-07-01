import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { X, Upload } from "lucide-react";

const PRESETS = [
  { style: "open-peeps", seed: "Jasper" },
  { style: "open-peeps", seed: "Aiden" },
  { style: "open-peeps", seed: "Nadia" },
  { style: "open-peeps", seed: "Isla" },
  { style: "open-peeps", seed: "Kai" },
  { style: "open-peeps", seed: "Bianca" },
  { style: "open-peeps", seed: "Dante" },
  { style: "big-smile", seed: "Jasper" },
  { style: "big-smile", seed: "Aiden" },
  { style: "big-smile", seed: "Nadia" },
  { style: "big-smile", seed: "Isla" },
  { style: "big-smile", seed: "Kai" },
  { style: "big-smile", seed: "Bianca" },
  { style: "big-smile", seed: "Dante" },
];

export default function AvatarPickerModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || null);
  const [uploadFile, setUploadFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const getAvatarUrl = (style, seed) =>
    `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setUploadFile(null);
    setPreviewUrl(getAvatarUrl(preset.style, preset.seed));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setSelectedPreset(null);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (uploadFile) {
        const { user: updatedUser } = await api.uploadAvatar(uploadFile);
        updateUser(updatedUser);
      } else if (selectedPreset) {
        const avatarUrl = getAvatarUrl(selectedPreset.style, selectedPreset.seed);
        const { user: updatedUser } = await api.updateProfile({ avatarUrl });
        updateUser(updatedUser);
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar avatar:", err);
      setError(err.message || "Erro ao salvar avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setError(null);
    try {
      const { user: updatedUser } = await api.updateProfile({ avatarUrl: null });
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      console.error("Erro ao remover avatar:", err);
      setError(err.message || "Erro ao remover avatar");
    } finally {
      setSaving(false);
    }
  };

  const currentInitials = user?.name?.split(" ")[0]?.slice(0, 2)?.toUpperCase() || "U";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Seu Avatar</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-400">{currentInitials}</span>
            )}
          </div>
        </div>

        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Escolha um avatar</p>
        <div className="grid grid-cols-5 gap-1 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={`${preset.style}-${preset.seed}`}
              onClick={() => handlePresetSelect(preset)}
              className="p-0 rounded transition-all flex items-center justify-center"
            >
              <img
                src={getAvatarUrl(preset.style, preset.seed)}
                alt=""
                className={`w-12 h-12 rounded bg-slate-50 ${
                  selectedPreset?.seed === preset.seed && selectedPreset?.style === preset.style
                    ? "ring-2 ring-brand-500"
                    : "hover:ring-2 hover:ring-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-4 mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ou envie sua foto</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all w-full justify-center text-sm font-semibold text-slate-500 hover:text-brand-600"
          >
            <Upload size={16} />
            Escolher imagem
          </button>
          {uploadFile && (
            <p className="text-xs text-slate-400 mt-1.5">{uploadFile.name}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          {user?.avatarUrl && (
            <button
              onClick={handleRemove}
              className="py-2.5 px-4 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
            >
              Remover
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!selectedPreset && !uploadFile)}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
