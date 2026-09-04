import { Routes, Route, Link } from 'react-router-dom';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <nav style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Link to="/">Farmer</Link>
        <Link to="/buyer">Buyer</Link>
      </nav>
      <Routes>
        <Route path="/" element={<FarmerDashboard />} />
        <Route path="/buyer" element={<BuyerDashboard />} />
      </Routes>
    </div>
  );
}
