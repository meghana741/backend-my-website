const fs = require('fs');

const contextContent = `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authAPI,
  requestsAPI,
  recyclingAPI,
  notificationsAPI,
  reportsAPI,
  usersAPI,
  publicAPI
} from '../api/api';
import {
  INITIAL_USERS,
  INITIAL_AGENTS,
  RECYCLING_PARTNERS,
  ACCEPTED_CATEGORIES
} from '../data/mockData';

// Create context
const EwasteContext = createContext(null);

/**
 * Normalizes backend request record to match frontend UI expectations
 */
function normalizeRequest(r) {
  if (!r) return null;
  return {
    ...r,
    id: r.trackingNumber || (typeof r.id === 'string' ? r.id : \`EW-2026-\${r.id}\`),
    dbId: r.id,
    trackingNumber: r.trackingNumber || r.id,
    category: r.categoryName || r.category || 'General Electronics',
    weightKg: r.actualWeight || r.estimatedWeight || r.weightKg || 1,
    address: r.pickupAddress || r.address || '',
    preferredDate: r.preferredPickupDate ? String(r.preferredPickupDate).split('T')[0] : r.preferredDate,
    timeSlot: r.preferredTimeSlot || r.timeSlot || 'Morning (09:00 AM - 12:00 PM)',
    instructions: r.userNotes || r.instructions || '',
    statusHistory: r.timeline || r.statusHistory || [
      { status: r.status || 'Pending', timestamp: r.createdAt || new Date().toISOString(), note: 'Request registered' }
    ]
  };
}

export const EwasteProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ewaste_currentUser');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [recyclingPartners, setRecyclingPartners] = useState(RECYCLING_PARTNERS);
  const [categories, setCategories] = useState(ACCEPTED_CATEGORIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Toast helpers
  const addToast = useCallback((toast) => {
    const id = \`toast-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`;
    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Initial Authentication Check
  useEffect(() => {
    async function verifyAuth() {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res?.user) {
            setCurrentUser(res.user);
            setToken(savedToken);
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing authentication token.');
          authAPI.logout();
          setCurrentUser(null);
          setToken('');
        }
      }
      setAuthLoading(false);
    }
    verifyAuth();
  }, []);

  // 2. Fetch Public & Operational Master Data (Categories, Agents, Recycling Partners)
  const fetchMasterData = useCallback(async () => {
    try {
      // Categories
      const catRes = await publicAPI.getCategories().catch(() => null);
      if (catRes?.categories?.length) {
        setCategories(catRes.categories);
      }

      // Recycling Partners
      const partnerRes = await recyclingAPI.getCenters().catch(() => null);
      if (partnerRes?.centers?.length) {
        const formatted = partnerRes.centers.map(c => ({
          id: \`rec-\${c.id}\`,
          dbId: c.id,
          name: c.name,
          specialty: c.specialization,
          isoCertified: c.licenseNumber || 'CPCB Registered',
          location: c.address ? \`\${c.address}, \${c.city}\` : c.city,
          capacityTonsPerMonth: 120,
          currentLoad: '65%'
        }));
        setRecyclingPartners(formatted);
      }
    } catch (err) {
      console.warn('Master data load warning:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // 3. Fetch User or Admin Requests
  const fetchRequests = useCallback(async () => {
    if (!token && !currentUser) return;
    setLoading(true);
    try {
      let res;
      if (currentUser?.role === 'admin' || currentUser?.role === 'agent') {
        res = await requestsAPI.getAll();
        // Also fetch collection agents if admin
        const agentRes = await usersAPI.getAgents().catch(() => null);
        if (agentRes?.agents?.length) {
          const formattedAgents = agentRes.agents.map(a => ({
            id: a.id,
            name: a.name,
            phone: a.phone || '+91 98000 00000',
            vehicleNumber: 'KA-01-EV-1001 (Eco Van)',
            zone: a.city || 'Central Hub',
            activePickups: 2,
            rating: 4.9
          }));
          setAgents(formattedAgents);
        }
        // Also fetch all registered users
        const usersRes = await usersAPI.getAll().catch(() => null);
        if (usersRes?.users?.length) {
          setUsers(usersRes.users);
        }
      } else {
        res = await requestsAPI.getMyRequests();
      }

      if (res?.requests) {
        const normalized = res.requests.map(normalizeRequest);
        setRequests(normalized);
      }
    } catch (err) {
      console.error('Failed to load requests from backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, currentUser]);

  // 4. Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsAPI.getAll();
      if (res?.notifications) {
        const normalized = res.notifications.map(n => ({
          ...n,
          read: Boolean(n.isRead),
          timestamp: n.createdAt
        }));
        setNotifications(normalized);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  }, [token]);

  // Trigger requests and notifications whenever user/token changes
  useEffect(() => {
    if (token && currentUser) {
      fetchRequests();
      fetchNotifications();
    }
  }, [token, currentUser, fetchRequests, fetchNotifications]);

  // --- Auth Actions ---
  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.adminLogin(email, password);
      if (res.user && res.token) {
        setCurrentUser(res.user);
        setToken(res.token);
        addToast({
          type: 'success',
          title: 'Welcome Admin!',
          message: \`Logged in as \${res.user.name}\`,
          timeout: 3000
        });
        return { success: true, user: res.user };
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Admin login failed',
        message: err.message || 'Invalid admin credentials.',
        timeout: 5000
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const citizenLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.citizenLogin(email, password);
      if (res.user && res.token) {
        setCurrentUser(res.user);
        setToken(res.token);
        addToast({
          type: 'success',
          title: 'Welcome Citizen!',
          message: \`Logged in as \${res.user.name}\`,
          timeout: 3000
        });
        return { success: true, user: res.user };
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Citizen login failed',
        message: err.message || 'Invalid email or password.',
        timeout: 5000
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const citizenRegister = async (userData) => {
    setLoading(true);
    try {
      const res = await authAPI.citizenRegister(userData);
      if (res.user && res.token) {
        setCurrentUser(res.user);
        setToken(res.token);
        addToast({
          type: 'success',
          title: 'Citizen account created!',
          message: \`Welcome to EcoCycle, \${res.user.name}!\`,
          timeout: 4000
        });
        return { success: true, user: res.user };
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Registration failed',
        message: err.message || 'Could not create citizen account.',
        timeout: 5000
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, portalType = null) => {
    if (portalType === 'admin' || email === 'admin@ecocycle.com') {
      return adminLogin(email, password);
    }
    return citizenLogin(email, password);
  };

  const register = async (userData) => {
    return citizenRegister(userData);
  };

  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setToken('');
    setRequests([]);
    setNotifications([]);
    addToast({
      type: 'info',
      title: 'Signed out',
      message: 'You have been logged out securely.',
      timeout: 3000
    });
  };

  // --- Request Actions ---
  const createRequest = async (formData) => {
    setLoading(true);
    try {
      // Find categoryId
      let catId = 1;
      const matchedCat = categories.find(c => c.name === formData.category || c.id === formData.categoryId);
      if (matchedCat) {
        catId = matchedCat.id;
      }

      const payload = {
        itemName: formData.itemName,
        categoryId: catId,
        quantity: parseInt(formData.quantity, 10) || 1,
        condition: formData.condition,
        estimatedWeight: parseFloat(formData.weightKg) || 1.0,
        pickupAddress: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        preferredPickupDate: formData.preferredDate,
        preferredTimeSlot: formData.timeSlot,
        contactPhone: currentUser?.phone || formData.phone || '+91 98765 43210',
        userNotes: formData.instructions
      };

      const res = await requestsAPI.create(payload);
      if (res?.request) {
        const normalized = normalizeRequest(res.request);
        setRequests(prev => [normalized, ...prev]);
        addToast({
          type: 'success',
          title: 'Pickup scheduled!',
          message: \`Request \${normalized.id} submitted successfully\`,
          timeout: 4000
        });
        // Refresh notifications
        fetchNotifications();
        return normalized;
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to schedule pickup',
        message: err.message || 'Server error while submitting request.',
        timeout: 5000
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id, status, notes = '') => {
    try {
      // Find request
      const req = requests.find(r => r.id === id || r.dbId === id);
      const targetId = req?.dbId || id;

      const res = await requestsAPI.updateStatus(targetId, { status, notes });
      if (res?.request) {
        const normalized = normalizeRequest(res.request);
        setRequests(prev => prev.map(r => (r.id === id || r.dbId === targetId ? normalized : r)));
        addToast({
          type: 'success',
          title: 'Status updated',
          message: \`Request \${normalized.id} is now \${status}\`,
          timeout: 3000
        });
        return normalized;
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to update status',
        message: err.message,
        timeout: 4000
      });
      throw err;
    }
  };

  const schedulePickup = async (id, agentId, agentName, scheduledDate = new Date().toISOString()) => {
    try {
      const req = requests.find(r => r.id === id || r.dbId === id);
      const targetId = req?.dbId || id;

      const res = await requestsAPI.schedule(targetId, {
        assignedAgentId: agentId,
        assignedAgentName: agentName,
        scheduledDate
      });

      if (res?.request) {
        const normalized = normalizeRequest(res.request);
        setRequests(prev => prev.map(r => (r.id === id || r.dbId === targetId ? normalized : r)));
        addToast({
          type: 'info',
          title: 'Agent assigned',
          message: \`\${agentName} assigned to \${normalized.id}\`,
          timeout: 3000
        });
        return normalized;
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Scheduling failed',
        message: err.message,
        timeout: 4000
      });
      throw err;
    }
  };

  // --- Notification Actions ---
  const markNotificationAsRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: 1 } : n))
    );
    try {
      await notificationsAPI.markAsRead(id);
    } catch (err) {
      console.warn('Notification mark read API error:', err.message);
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: 1 })));
    try {
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.warn('Notifications mark all read API error:', err.message);
    }
  };

  // Demo Switch User Role (for testing Admin vs Citizen without re-typing)
  const switchUserRole = async (targetRole) => {
    const demoAccounts = {
      admin: { email: 'admin@ecocycle.com', password: 'EcoAdmin@2026' },
      citizen: { email: 'meghana@example.com', password: 'password123' },
      user: { email: 'meghana@example.com', password: 'password123' }
    };
    const creds = demoAccounts[targetRole] || demoAccounts.citizen;
    try {
      await login(creds.email, creds.password, targetRole);
    } catch {
      // Local fallback if offline
      const u = users.find(x => x.role === targetRole) || users[0];
      setCurrentUser(u);
    }
  };

  const value = {
    // State
    currentUser,
    token,
    users,
    agents,
    categories,
    recyclingPartners,
    requests,
    setRequests,
    notifications,
    toasts,
    loading,
    authLoading,

    // Actions
    login,
    register,
    adminLogin,
    citizenLogin,
    citizenRegister,
    logout,
    createRequest,
    updateRequestStatus,
    schedulePickup,
    fetchRequests,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsRead,
    addToast,
    removeToast,
    switchUserRole
  };

  return <EwasteContext.Provider value={value}>{children}</EwasteContext.Provider>;
};

export const useEwaste = () => useContext(EwasteContext);
`;

fs.writeFileSync('C:/Users/megha/my-website/src/context/EwasteContext.jsx', contextContent, 'utf8');
console.log('Successfully updated C:/Users/megha/my-website/src/context/EwasteContext.jsx');
