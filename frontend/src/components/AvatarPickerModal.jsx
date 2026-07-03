import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { X, Upload, Trash2 } from "lucide-react";
import { getAvatarProps } from "./dashboard/Shared";

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

  const { initials, color: avatarColor } = getAvatarProps(user?.name);

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      {/* Invisible backdrop for closing on click outside (optional, if you want click outside) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-card-hover w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">Seu Avatar</h2>
          <button onClick={onClose} className="p-2 rounded-[12px] hover:bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div 
            className="w-[84px] h-[84px] rounded-[18px] flex items-center justify-center overflow-hidden border border-[var(--border)] shadow-sm"
            style={{ backgroundColor: previewUrl ? "transparent" : avatarColor.bg, color: avatarColor.text }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[28px] font-extrabold tracking-wide">{initials}</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Escolha um avatar</p>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={`${preset.style}-${preset.seed}`}
                onClick={() => handlePresetSelect(preset)}
                className="p-0 rounded-[12px] transition-all flex items-center justify-center overflow-hidden"
              >
                <img
                  src={getAvatarUrl(preset.style, preset.seed)}
                  alt=""
                  className={`w-[60px] h-[60px] rounded-[12px] bg-[var(--surface-alt)] transition-all ${
                    selectedPreset?.seed === preset.seed && selectedPreset?.style === preset.style
                      ? "ring-2 ring-[var(--sage)] shadow-sm scale-[0.95]"
                      : "hover:ring-2 hover:ring-[var(--border)] hover:bg-[var(--bg)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-3">Ou envie sua foto</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 rounded-[14px] border-2 border-dashed border-[var(--border)] hover:border-[var(--sage)] hover:bg-[var(--sage-light)] dark:hover:bg-[#1A3028] transition-all w-full justify-center text-[13px] font-bold text-[var(--text-secondary)] hover:text-[var(--dark-green)] dark:hover:text-[#5CBF9D]"
          >
            <Upload size={16} />
            Escolher imagem
          </button>
          {uploadFile && (
            <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center font-semibold truncate px-2">{uploadFile.name}</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-[12px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-[13px] text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[12px] border border-[var(--border)] text-[13px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors">
            Cancelar
          </button>
          
          {user?.avatarUrl && (
            <button
              onClick={handleRemove}
              className="w-[42px] h-[42px] rounded-[12px] border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors flex-shrink-0"
              title="Remover avatar"
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving || (!selectedPreset && !uploadFile)}
            className="flex-1 py-2.5 rounded-[12px] bg-[var(--sage)] text-white text-[13px] font-bold hover:bg-[var(--dark-green)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
