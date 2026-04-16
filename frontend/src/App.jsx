import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

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

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function LoadingScreen() {
  console.log("📍 LoadingScreen renderizado");
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-brand-950 border-t-transparent animate-spin" />
        <p className="text-sm text-brand-500 font-medium">Carregando aplicação...</p>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        <Route path="/home" element={<ProtectedRoute><AnimatedPage><Home /></AnimatedPage></ProtectedRoute>} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/patients" element={<ProtectedRoute><AnimatedPage><Patients /></AnimatedPage></ProtectedRoute>} />
        <Route path="/patients/:id" element={<ProtectedRoute><AnimatedPage><PatientRecord /></AnimatedPage></ProtectedRoute>} />
        <Route path="/my-forms" element={<ProtectedRoute><AnimatedPage><MyForms /></AnimatedPage></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><AnimatedPage><Library /></AnimatedPage></ProtectedRoute>} />
        
        <Route path="/forms/new" element={<ProtectedRoute><AnimatedPage><FormBuilder /></AnimatedPage></ProtectedRoute>} />
        <Route path="/forms/:id/edit" element={<ProtectedRoute><AnimatedPage><FormBuilder /></AnimatedPage></ProtectedRoute>} />
        <Route path="/forms/:id/preview" element={<ProtectedRoute><AnimatedPage><FormPreview /></AnimatedPage></ProtectedRoute>} />
        <Route path="/forms/:id/responses" element={<ProtectedRoute><AnimatedPage><FormResponses /></AnimatedPage></ProtectedRoute>} />
        <Route path="/responses/:id" element={<ProtectedRoute><AnimatedPage><ResponseDetail /></AnimatedPage></ProtectedRoute>} />
        
        <Route path="/share/:token" element={<ShareLink />} />
        <Route path="/form/:token" element={<PatientForm />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
