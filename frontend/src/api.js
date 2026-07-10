const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function headers() {
  return { 'Content-Type': 'application/json' }
}

function opts(method, body) {
  return {
    method,
    headers: headers(),
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = 'Request failed'
    try { const data = await res.json(); detail = data.detail || detail } catch {}
    throw new Error(detail)
  }
  return res.json()
}

function get(path) {
  return fetch(`${BASE}${path}`, opts('GET')).then(handleResponse)
}

function post(path, body) {
  return fetch(`${BASE}${path}`, opts('POST', body)).then(handleResponse)
}

function put(path, body) {
  return fetch(`${BASE}${path}`, opts('PUT', body)).then(handleResponse)
}

function del(path) {
  return fetch(`${BASE}${path}`, opts('DELETE')).then(handleResponse)
}

function patch(path, body) {
  return fetch(`${BASE}${path}`, opts('PATCH', body)).then(handleResponse)
}

// Auth
export const auth = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (email, username, password) => post('/auth/register', { email, username, password }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  updateProfileVisibility: (visible) => patch('/auth/me/profile-visibility', { profile_public: visible }),
}

// Problems — convert camelCase↔snake_case for backend
function toBackend(p) {
  return {
    title: p.title,
    url: p.url || null,
    topic: p.topic,
    difficulty: p.difficulty,
    notes: p.notes || null,
    key_insight: p.keyInsight || null,
  }
}

function fromBackend(p) {
  return {
    id: String(p.id),
    title: p.title,
    url: p.url,
    topic: p.topic,
    difficulty: p.difficulty,
    notes: p.notes || '',
    keyInsight: p.key_insight || '',
    interval: p.interval,
    easeFactor: p.ease_factor,
    repetitions: p.repetitions,
    soloStreak: p.solo_streak,
    frozen: p.frozen,
    lastOutcome: p.last_outcome,
    nextReviewDate: p.next_review_date,
    dateAdded: p.date_added,
  }
}

export const problemsApi = {
  list: async () => {
    const data = await get('/problems')
    return data.map(fromBackend)
  },
  create: async (problem) => {
    const data = await post('/problems', toBackend(problem))
    return fromBackend(data)
  },
  update: async (id, problem) => {
    const data = await put(`/problems/${id}`, toBackend(problem))
    return fromBackend(data)
  },
  delete: (id) => del(`/problems/${id}`),
  review: async (id, outcome) => {
    const data = await post(`/problems/${id}/review`, { outcome })
    return fromBackend(data)
  },
}

// Stats & History
export const reviewsApi = {
  history: (days = 30) => get(`/reviews/history?days=${days}`),
  stats: () => get('/reviews/stats'),
}

// Admin
export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  users: () => get('/admin/users'),
  user: (id) => get(`/admin/users/${id}`),
  userActivity: (id, days = 365) => get(`/admin/users/${id}/activity?days=${days}`),
  userProblems: (id) => get(`/admin/users/${id}/problems`),
  updateRole: (id, role) => patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => del(`/admin/users/${id}`),
}

// Public Profiles
export const profilesApi = {
  list: (q = '') => get(`/profiles${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (username) => get(`/profiles/${encodeURIComponent(username)}`),
  history: (username, days = 365) => get(`/profiles/${encodeURIComponent(username)}/history?days=${days}`),
  problems: (username) => get(`/profiles/${encodeURIComponent(username)}/problems`),
}

// GitHub
export const githubApi = {
  config: () => get('/auth/github/config'),
  connect: (code, state) => post('/auth/github', { code, state }),
  setLanguage: (language) => post('/auth/github/language', { language }),
  sync: () => post('/github/sync'),
  setupRepo: () => post('/github/setup-repo'),
  disconnect: () => post('/github/disconnect'),
}
