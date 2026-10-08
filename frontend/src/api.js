const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const getStoredUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
export const setStoredUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || JSON.stringify(errData);
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  async switchDemoRole(role) {
    const data = await request(`/auth/demo-switch/${role}`, {
      method: 'POST',
    });
    setAuthToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  async getMe() {
    return request('/auth/me');
  },

  logout() {
    removeAuthToken();
    removeStoredUser();
  },

  // Tasks
  async getTasks(status = null) {
    const q = status ? `?status=${status}` : '';
    return request(`/tasks${q}`);
  },

  async getTaskDetail(id) {
    return request(`/tasks/${id}`);
  },

  async createTask(taskData) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async managerDecision(taskId, decisionData) {
    return request(`/tasks/${taskId}/manager-decision`, {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  },

  // Submissions
  async submitWork(taskId, formData) {
    return request(`/tasks/${taskId}/submit`, {
      method: 'POST',
      body: formData,
    });
  },

  // Metrics
  async getManagerMetrics() {
    return request('/metrics/manager');
  },

  async getInternMetrics() {
    return request('/metrics/intern');
  },

  async getProgramProgress() {
    return request('/program/progress');
  },

  // Notifications
  async getNotifications(channel = null) {
    const q = channel && channel !== 'ALL' ? `?channel=${channel}` : '';
    return request(`/notifications${q}`);
  },

  async markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllNotificationsRead() {
    return request('/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Demo utilities
  async reseedData() {
    return request('/admin/reseed', {
      method: 'POST',
    });
  },

  getSampleFileUrl(filename) {
    return `${API_BASE}/sample-files/${filename}`;
  },
};
