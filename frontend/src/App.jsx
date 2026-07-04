import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Components
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ToastContainer from "./components/Toast";

// Pages (Lazy Loaded for Code-Splitting)
const Home = lazy(() => import("./pages/Home"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientRecord = lazy(() => import("./pages/PatientRecord"));
const MyForms = lazy(() => import("./pages/MyForms"));
const Library = lazy(() => import("./pages/Library"));
const CustomFormBuilder = lazy(() => import("./pages/CustomFormBuilder"));
const FormPreview = lazy(() => import("./pages/FormPreview"));
const FormResponses = lazy(() => import("./pages/FormResponses"));
const ResponseDetail = lazy(() => import("./pages/ResponseDetail"));
const ShareLink = lazy(() => import("./pages/ShareLink"));
const PatientForm = lazy(() => import("./pages/PatientForm"));
const Agenda = lazy(() => import("./pages/Agenda"));
const CrmDashboard = lazy(() => import("./pages/CrmDashboard"));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Carregando aplicação...</p>
      </div>
    </div>
  );
}

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

export default function App() {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/crm" element={<ProtectedRoute><CrmDashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientRecord /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/my-forms" element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          
          <Route path="/forms/new" element={<ProtectedRoute><CustomFormBuilder /></ProtectedRoute>} />
          <Route path="/forms/:id/edit" element={<ProtectedRoute><CustomFormBuilder /></ProtectedRoute>} />
          <Route path="/forms/:id/preview" element={<ProtectedRoute><FormPreview /></ProtectedRoute>} />
          <Route path="/forms/:id/responses" element={<ProtectedRoute><FormResponses /></ProtectedRoute>} />
          <Route path="/responses/:id" element={<ProtectedRoute><ResponseDetail /></ProtectedRoute>} />
          
          <Route path="/share/:token" element={<ShareLink />} />
          <Route path="/form/:token" element={<PatientForm />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
