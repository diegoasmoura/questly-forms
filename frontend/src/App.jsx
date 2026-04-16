import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Components
import Layout from "./components/Layout";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Patients from "./pages/Patients";
import PatientRecord from "./pages/PatientRecord";
import MyForms from "./pages/MyForms";
import Library from "./pages/Library";
import FormBuilder from "./pages/FormBuilder";
import FormPreview from "./pages/FormPreview";
import FormResponses from "./pages/FormResponses";
import ResponseDetail from "./pages/ResponseDetail";
import ShareLink from "./pages/ShareLink";
import PatientForm from "./pages/PatientForm";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Carregando aplicação...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><PatientRecord /></ProtectedRoute>} />
      <Route path="/my-forms" element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      
      <Route path="/forms/new" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
      <Route path="/forms/:id/edit" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
      <Route path="/forms/:id/preview" element={<ProtectedRoute><FormPreview /></ProtectedRoute>} />
      <Route path="/forms/:id/responses" element={<ProtectedRoute><FormResponses /></ProtectedRoute>} />
      <Route path="/responses/:id" element={<ProtectedRoute><ResponseDetail /></ProtectedRoute>} />
      
      <Route path="/share/:token" element={<ShareLink />} />
      <Route path="/form/:token" element={<PatientForm />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
