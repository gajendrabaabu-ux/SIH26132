const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export const api = {
  login: (phone, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  myLots: () => request('/api/lots/mine'),
  createLot: (data) => request('/api/lots', { method: 'POST', body: JSON.stringify(data) }),
  matchBuyers: (lotId) => request(`/api/lots/${lotId}/match-buyers`, { method: 'POST' }),
  acceptOffer: (offerId) => request(`/api/offers/${offerId}/accept`, { method: 'POST' }),
};
