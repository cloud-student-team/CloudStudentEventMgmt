const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const API_BASE = API_URL.replace(/\/api$/, '');

export function getPosterUrl(posterUrl) {
  if (!posterUrl) return null;
  if (posterUrl.startsWith('http')) return posterUrl;
  return `${API_BASE}${posterUrl}`;
}

export default API_URL;
