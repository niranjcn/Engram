const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function headers() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

function get(path) {
  return fetch(`${BASE}${path}`, { headers: headers() }).then(handleResponse)
}

function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

function put(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

function del(path) {
  return fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: headers(),
  }).then(handleResponse)
}

// Auth
export const auth = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (email, username, password) => post('/auth/register', { email, username, password }),
  me: () => get('/auth/me'),
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
