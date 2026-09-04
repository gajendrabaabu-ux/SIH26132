import { Routes, Route, Link } from 'react-router-dom';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';
import { useLanguage } from './context/LanguageContext.jsx';

export default function App() {
  const { lang, changeLang, t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <nav className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex gap-4 font-semibold text-gray-700">
          <Link to="/" className="hover:text-green-700 transition">Farmer</Link>
          <Link to="/buyer" className="hover:text-green-700 transition">Buyer</Link>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => changeLang('en')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              lang === 'en' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLang('ta')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              lang === 'ta' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<FarmerDashboard />} />
        <Route path="/buyer" element={<BuyerDashboard />} />
      </Routes>
    </div>
  );
}