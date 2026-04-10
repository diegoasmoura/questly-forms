import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Copy, Check, Loader2 } from "lucide-react";

export default function ShareLink() {
  const { token } = useParams();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/form/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-950 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 140 31" fill="white">
            <path d="M64.062 26.378v3.771H77.96v-3.771h-4.386V9.652h-9.1v3.73h4.303v12.996h-4.714ZM70.703.6c-1.886 0-3.443 1.394-3.443 3.444s1.557 3.443 3.443 3.443c1.886 0 3.444-1.394 3.444-3.443 0-2.05-1.558-3.444-3.444-3.444Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-brand-950 mb-2">
          Form Shared Successfully!
        </h1>
        <p className="text-brand-500 mb-6">
          Share this link with your patient so they can fill out the form.
        </p>

        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg p-3 mb-6">
          <code className="flex-1 text-sm text-brand-700 truncate">{shareUrl}</code>
          <button
            onClick={handleCopy}
            className="btn btn-primary text-xs px-3 py-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary w-full"
        >
          Open Form
        </a>
      </div>
    </div>
  );
}
