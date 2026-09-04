import { useLanguage } from '../context/LanguageContext.jsx';

export default function BuyerDashboard() {
  const { t } = useLanguage();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{t('buyer_dashboard_title')}</h1>
      <p>{t('buyer_dashboard_placeholder')}</p>
    </div>
  );
}
