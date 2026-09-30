import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import CitizenAuth from './pages/CitizenAuth';
import CitizenPortal from './pages/CitizenPortal';
import AdminAuth from './pages/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/auth/citizen" element={<CitizenAuth />} />
        <Route path="/portal" element={<CitizenPortal />} />
        <Route path="/auth/admin" element={<AdminAuth />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <>
      <div className="mesh-bg" />
      <Router>
        <AnimatedRoutes />
      </Router>
    </>
  );
}
