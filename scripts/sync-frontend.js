const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\megha\\my-website\\src\\api\\api.js';

const content = `/**
 * EcoCycle API Client
 * Connects frontend to Node.js + Express + SQL Server backend
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal fetch wrapper with authorization and error normalization
 */
async function apiRequest(endpoint, options = {}) {
  const url = \`\${API_BASE_URL}\${endpoint}\`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = \`Bearer \${token}\`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = { success: response.ok, message: response.statusText };
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('ewaste_currentUser');
      }
      const errorMsg = data?.message || \`Request failed with status \${response.status}\`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(\`API Error [\${config.method || 'GET'} \${endpoint}]:\`, err.message);
    throw err;
  }
}

// 1. Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('ewaste_currentUser', JSON.stringify(res.user));
    }
    return res;
  },

  register: async (userData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('ewaste_currentUser', JSON.stringify(res.user));
    }
    return res;
  },

  getMe: async () => {
    return await apiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: profileData
    });
    if (res.user) {
      localStorage.setItem('ewaste_currentUser', JSON.stringify(res.user));
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('ewaste_currentUser');
  }
};

// 2. Pickup Request APIs
export const requestsAPI = {
  create: async (data) => {
    return await apiRequest('/requests', {
      method: 'POST',
      body: data
    });
  },

  getMyRequests: async (status = 'All') => {
    const query = status && status !== 'All' ? \`?status=\${encodeURIComponent(status)}\` : '';
    return await apiRequest(\`/requests/my-requests\${query}\`);
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString() ? \`?\${params.toString()}\` : '';
    return await apiRequest(\`/requests\${qs}\`);
  },

  getById: async (id) => {
    return await apiRequest(\`/requests/\${id}\`);
  },

  track: async (trackingNumber) => {
    return await apiRequest(\`/requests/track/\${encodeURIComponent(trackingNumber)}\`);
  },

  updateStatus: async (id, data) => {
    return await apiRequest(\`/requests/\${id}/status\`, {
      method: 'PUT',
      body: data
    });
  },

  schedule: async (id, scheduleData) => {
    return await apiRequest(\`/requests/\${id}/schedule\`, {
      method: 'PUT',
      body: scheduleData
    });
  },

  cancel: async (id) => {
    return await apiRequest(\`/requests/\${id}\`, {
      method: 'DELETE'
    });
  }
};

// 3. Recycling APIs
export const recyclingAPI = {
  getBatches: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.itemType && filters.itemType !== 'All') params.append('itemType', filters.itemType);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.facility && filters.facility !== 'All') params.append('facility', filters.facility);
    const qs = params.toString() ? \`?\${params.toString()}\` : '';
    return await apiRequest(\`/recycling\${qs}\`);
  },

  getBatchById: async (id) => {
    return await apiRequest(\`/recycling/\${id}\`);
  },

  createBatch: async (data) => {
    return await apiRequest('/recycling', {
      method: 'POST',
      body: data
    });
  },

  updateBatch: async (id, data) => {
    return await apiRequest(\`/recycling/\${id}\`, {
      method: 'PUT',
      body: data
    });
  },

  getCenters: async () => {
    return await apiRequest('/recycling/centers');
  }
};

// 4. Notifications APIs
export const notificationsAPI = {
  getAll: async () => {
    return await apiRequest('/notifications');
  },

  markAsRead: async (id) => {
    return await apiRequest(\`/notifications/\${id}/read\`, {
      method: 'PUT'
    });
  },

  markAllAsRead: async () => {
    return await apiRequest('/notifications/read-all', {
      method: 'PUT'
    });
  },

  delete: async (id) => {
    return await apiRequest(\`/notifications/\${id}\`, {
      method: 'DELETE'
    });
  }
};

// 5. Reports & Dashboards APIs
export const reportsAPI = {
  getUserDashboard: async () => {
    return await apiRequest('/reports/user-dashboard');
  },

  getSummary: async () => {
    return await apiRequest('/reports/summary');
  },

  getMonthly: async () => {
    return await apiRequest('/reports/monthly');
  },

  getCategories: async () => {
    return await apiRequest('/reports/categories');
  }
};

// 6. User Management (Admin)
export const usersAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role && filters.role !== 'All') params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString() ? \`?\${params.toString()}\` : '';
    return await apiRequest(\`/users\${qs}\`);
  },

  getAgents: async () => {
    return await apiRequest('/users/agents');
  },

  updateRole: async (id, role) => {
    return await apiRequest(\`/users/\${id}/role\`, {
      method: 'PUT',
      body: { role }
    });
  },

  delete: async (id) => {
    return await apiRequest(\`/users/\${id}\`, {
      method: 'DELETE'
    });
  }
};

// 7. Public APIs
export const publicAPI = {
  getCategories: async () => {
    return await apiRequest('/public/categories');
  },

  getStats: async () => {
    return await apiRequest('/public/stats');
  },

  calculateImpact: async (data) => {
    return await apiRequest('/public/calculate-impact', {
      method: 'POST',
      body: data
    });
  }
};

export default {
  auth: authAPI,
  requests: requestsAPI,
  recycling: recyclingAPI,
  notifications: notificationsAPI,
  reports: reportsAPI,
  users: usersAPI,
  public: publicAPI
};
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully created:', targetPath);
