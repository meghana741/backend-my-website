const fs = require('fs');

// 1. Update UserDashboard.jsx
const userDashboardContent = `import React, { useState, useEffect } from 'react';
import { useEwaste } from '../context/EwasteContext';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../api/api';
import { LayoutDashboard, Clock, CheckCircle2, Truck, Package, CalendarPlus, Loader2, Leaf, TreePine } from 'lucide-react';

const UserDashboard = () => {
  const { currentUser, requests, loading } = useEwaste();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      if (!currentUser) return;
      setStatsLoading(true);
      try {
        const res = await reportsAPI.getUserDashboard();
        if (res?.dashboard) {
          setDashboardStats(res.dashboard);
        }
      } catch (err) {
        console.warn('Dashboard stats fallback to request calculation:', err.message);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [currentUser, requests]);

  // Filter requests belonging to this user
  const userRequests = requests;

  const pending = dashboardStats?.pendingRequests ?? userRequests.filter((r) => r.status === 'Pending').length;
  const inProgress = (dashboardStats?.approvedRequests || 0) + (dashboardStats?.scheduledPickups || 0) + (dashboardStats?.collectedRequests || 0) || userRequests.filter((r) => r.status === 'Approved' || r.status === 'Pickup Scheduled' || r.status === 'Collected' || r.status === 'Sent for Recycling').length;
  const completed = dashboardStats?.completedCollections ?? userRequests.filter((r) => r.status === 'Recycling Completed').length;
  const totalWeight = dashboardStats?.totalWeightContributed ?? userRequests.reduce((s, r) => s + (parseFloat(r.weightKg) || 0), 0).toFixed(1);
  const co2Saved = dashboardStats?.co2SavedKg ?? (totalWeight * 1.85).toFixed(1);

  const stats = [
    { label: 'Total Requests', value: dashboardStats?.totalRequests ?? userRequests.length, icon: <Package size={22} />, color: '#059669' },
    { label: 'Pending Review', value: pending, icon: <Clock size={22} />, color: '#f59e0b' },
    { label: 'In Progress', value: inProgress, icon: <Truck size={22} />, color: '#3b82f6' },
    { label: 'Recycling Completed', value: completed, icon: <CheckCircle2 size={22} />, color: '#10b981' },
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={24} /> Citizen Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Welcome back, <strong style={{ color: 'var(--color-text-title)' }}>{currentUser?.name || 'Citizen'}</strong>
          </p>
        </div>
        <Link to="/schedule-pickup" className="btn btn-primary">
          <CalendarPlus size={16} /> Schedule Pickup
        </Link>
      </div>

      {/* Environmental Eco Impact Summary Banner */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>Your Eco-Contribution</div>
              <div style={{ fontSize: '0.85rem', color: '#047857' }}>Doorstep pickups verified by certified green recyclers</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Weight Recycled</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>{totalWeight} <span style={{ fontSize: '0.85rem' }}>kg</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>CO₂ Prevented</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>{co2Saved} <span style={{ fontSize: '0.85rem' }}>kg</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ color: s.color, marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-title)' }}>
              {statsLoading ? '-' : s.value}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Requests Table */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-title)' }}>My Pickup Requests</h2>
          {loading && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />}
        </div>

        {userRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Package size={40} style={{ color: 'var(--color-text-light)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You have not submitted any pickup requests yet.</p>
            <Link to="/schedule-pickup" className="btn btn-primary"><CalendarPlus size={16} /> Schedule First Pickup</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={thStyle}>Tracking ID</th>
                <th style={thStyle}>Item Description</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {userRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>
                    <Link to={\`/track?id=\${req.id}\`} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {req.id}
                    </Link>
                  </td>
                  <td style={tdStyle}>{req.itemName}</td>
                  <td style={tdStyle}>{req.category}</td>
                  <td style={tdStyle}>{req.weightKg} kg</td>
                  <td style={tdStyle}><StatusPill status={req.status} /></td>
                  <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle = { textAlign: 'left', padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' };
const tdStyle = { padding: '0.65rem 0.75rem', color: 'var(--color-text-body)' };

const StatusPill = ({ status }) => {
  const colors = {
    'Pending': { bg: '#fef3c7', text: '#92400e' },
    'Approved': { bg: '#dbeafe', text: '#1e40af' },
    'Pickup Scheduled': { bg: '#e0e7ff', text: '#3730a3' },
    'Collected': { bg: '#d1fae5', text: '#065f46' },
    'Sent for Recycling': { bg: '#fce7f3', text: '#9d174d' },
    'Recycling Completed': { bg: '#d1fae5', text: '#047857' },
    'Rejected': { bg: '#fee2e2', text: '#b91c1c' },
  };
  const c = colors[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
};

export default UserDashboard;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/UserDashboard.jsx', userDashboardContent, 'utf8');
console.log('Updated UserDashboard.jsx');

// 2. Update AdminDashboard.jsx
const adminDashboardContent = `import React, { useState } from 'react';
import { useEwaste } from '../context/EwasteContext';
import { ShieldCheck, Users, Package, CheckCircle2, Clock, Truck, XCircle, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { requests, agents, users, updateRequestStatus, schedulePickup, loading } = useEwaste();
  const [filter, setFilter] = useState('All');
  const [processingId, setProcessingId] = useState(null);

  const filtered = filter === 'All' ? requests : requests.filter((r) => r.status === filter);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await updateRequestStatus(id, 'Approved', 'Verified and approved by administrator');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter the rejection reason:', 'Item not compliant with safe e-waste handling standards');
    if (reason === null) return;
    setProcessingId(id);
    try {
      await updateRequestStatus(id, 'Rejected', reason);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignAgent = async (requestId, agentId) => {
    const agent = agents.find((a) => String(a.id) === String(agentId));
    if (!agent) return;
    setProcessingId(requestId);
    try {
      await schedulePickup(requestId, agent.id, agent.name);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (requestId, nextStatus) => {
    setProcessingId(requestId);
    try {
      await updateRequestStatus(requestId, nextStatus);
    } finally {
      setProcessingId(null);
    }
  };

  const statuses = [
    'All',
    'Pending',
    'Approved',
    'Pickup Scheduled',
    'Collected',
    'Sent for Recycling',
    'Recycling Completed'
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={22} /> Admin Operations Portal
        </h1>
        {loading && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Loader2 size={16} className="animate-spin" /> Syncing with SQL Server...</span>}
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Manage live pickup requests, assign collection agents, and progress items through the recycling lifecycle
      </p>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <Package size={20} style={{ color: '#059669', margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{requests.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Total Requests</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <Clock size={20} style={{ color: '#f59e0b', margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{requests.filter(r => r.status === 'Pending').length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Pending</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <Truck size={20} style={{ color: '#3b82f6', margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{requests.filter(r => r.status === 'Pickup Scheduled' || r.status === 'Collected').length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>In Logistics</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <CheckCircle2 size={20} style={{ color: '#10b981', margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{requests.filter(r => r.status === 'Recycling Completed').length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Completed</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <Users size={20} style={{ color: '#8b5cf6', margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{users.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>System Users</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={filter === s ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
          >
            {s} {s !== 'All' && \`(\${requests.filter(r => r.status === s).length})\`}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="card" style={{ padding: '1rem', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={thStyle}>Request ID</th>
              <th style={thStyle}>User / Contact</th>
              <th style={thStyle}>Item & Category</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Agent</th>
              <th style={thStyle}>Weight</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={tdStyle}><strong>{req.id}</strong></td>
                <td style={tdStyle}>
                  <div>{req.userName || req.userEmail || 'Citizen'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.contactPhone || req.userPhone || req.city}</div>
                </td>
                <td style={tdStyle}>
                  <div>{req.itemName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.category} (Qty: {req.quantity || 1})</div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    backgroundColor: req.status === 'Pending' ? '#fef3c7' : req.status === 'Rejected' ? '#fee2e2' : '#d1fae5',
                    color: req.status === 'Pending' ? '#92400e' : req.status === 'Rejected' ? '#b91c1c' : '#047857'
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  {req.assignedAgentName || (req.assignedAgentId ? \`Agent #\${req.assignedAgentId}\` : <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>)}
                </td>
                <td style={tdStyle}>{req.weightKg} kg</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {processingId === req.id ? (
                      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <>
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              style={{ ...actionBtn, backgroundColor: '#d1fae5', color: '#047857' }}
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              style={{ ...actionBtn, backgroundColor: '#fee2e2', color: '#b91c1c' }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}

                        {req.status === 'Approved' && (
                          <select
                            onChange={(e) => e.target.value && handleAssignAgent(req.id, e.target.value)}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                          >
                            <option value="">Assign agent...</option>
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        )}

                        {req.status === 'Pickup Scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'Collected')}
                            style={{ ...actionBtn, backgroundColor: '#dbeafe', color: '#1e40af' }}
                          >
                            Mark Collected
                          </button>
                        )}

                        {req.status === 'Collected' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'Sent for Recycling')}
                            style={{ ...actionBtn, backgroundColor: '#fce7f3', color: '#9d174d' }}
                          >
                            Send to Recycler
                          </button>
                        )}

                        {req.status === 'Sent for Recycling' && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'Recycling Completed')}
                            style={{ ...actionBtn, backgroundColor: '#d1fae5', color: '#047857' }}
                          >
                            Mark Completed
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No requests match this filter.</p>
        )}
      </div>
    </div>
  );
};

const thStyle = { textAlign: 'left', padding: '0.6rem 0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.76rem', textTransform: 'uppercase' };
const tdStyle = { padding: '0.6rem 0.7rem', color: 'var(--color-text-body)' };
const actionBtn = { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.55rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 };

export default AdminDashboard;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/AdminDashboard.jsx', adminDashboardContent, 'utf8');
console.log('Updated AdminDashboard.jsx');

// 3. Update PickupTracking.jsx
const trackingContent = `import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useEwaste } from '../context/EwasteContext';
import { requestsAPI } from '../api/api';
import { STATUS_STEPS } from '../data/mockData';
import { Search, CheckCircle2, Circle, Clock, Truck, Factory, Award, Package, Loader2, AlertCircle } from 'lucide-react';

const PickupTracking = () => {
  const { requests } = useEwaste();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchId, setSearchId] = useState(searchParams.get('id') || '');
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-search if id is in query params
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setSearchId(idFromUrl);
      performTrack(idFromUrl);
    }
  }, [searchParams]);

  const performTrack = async (idToTrack) => {
    if (!idToTrack.trim()) return;
    setIsSearching(true);
    setErrorMessage('');
    try {
      const res = await requestsAPI.track(idToTrack.trim());
      if (res?.request) {
        setTrackedRequest(res.request);
      }
    } catch (err) {
      // Fallback to local state if offline
      const local = requests.find((r) => r.id === idToTrack.trim() || r.trackingNumber === idToTrack.trim());
      if (local) {
        setTrackedRequest(local);
      } else {
        setTrackedRequest(null);
        setErrorMessage(err.message || \`No pickup request found for \${idToTrack}\`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId) {
      setSearchParams({ id: searchId.trim() });
      performTrack(searchId.trim());
    }
  };

  const statusIcons = {
    'Pending': <Clock size={18} />,
    'Approved': <CheckCircle2 size={18} />,
    'Pickup Scheduled': <Package size={18} />,
    'Collected': <Truck size={18} />,
    'Sent for Recycling': <Factory size={18} />,
    'Recycling Completed': <Award size={18} />,
  };

  const currentStepIndex = trackedRequest ? STATUS_STEPS.indexOf(trackedRequest.status) : -1;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={22} /> Track Pickup Request
      </h1>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Tracking ID (e.g. EW-2026-1001)"
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSearching} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Track
        </button>
      </form>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c',
          fontSize: '0.88rem',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick links to existing requests if none selected */}
      {!trackedRequest && requests.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-title)' }}>Recent Requests in System</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSearchId(r.id);
                  setSearchParams({ id: r.id });
                  performTrack(r.id);
                }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.id}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{r.itemName?.substring(0, 30)}</span>
                <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: '12px', backgroundColor: '#d1fae5', color: '#047857', fontWeight: 600 }}>{r.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Request Details */}
      {trackedRequest && (
        <>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-title)' }}>{trackedRequest.trackingNumber || trackedRequest.id}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{trackedRequest.itemName}</p>
              </div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, backgroundColor: '#d1fae5', color: '#047857' }}>
                {trackedRequest.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-body)' }}>
              <div><strong>Category:</strong> {trackedRequest.categoryName || trackedRequest.category}</div>
              <div><strong>Weight:</strong> {trackedRequest.actualWeight || trackedRequest.estimatedWeight || trackedRequest.weightKg} kg</div>
              <div><strong>Pickup Location:</strong> {trackedRequest.pickupAddress || trackedRequest.address}, {trackedRequest.city}</div>
              <div><strong>Agent Assigned:</strong> {trackedRequest.assignedAgentName || 'To be scheduled'}</div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="card" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-title)' }}>Collection & Recycling Lifecycle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isPassed ? '#10b981' : '#f3f4f6',
                      color: isPassed ? 'white' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {statusIcons[step] || <Circle size={16} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: isCurrent ? 800 : isPassed ? 600 : 400, color: isPassed ? 'var(--color-text-title)' : 'var(--color-text-muted)' }}>
                        {step} {isCurrent && <span style={{ fontSize: '0.72rem', backgroundColor: '#d1fae5', color: '#047857', padding: '0.1rem 0.45rem', borderRadius: '10px', marginLeft: '0.5rem' }}>Active Stage</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Audit History Log from SQL Server */}
          {trackedRequest.timeline && trackedRequest.timeline.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-title)' }}>Activity Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {trackedRequest.timeline.map((item, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #10b981', paddingLeft: '1rem', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-title)' }}>{item.status}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-body)' }}>{item.description}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {new Date(item.timestamp).toLocaleString()} • {item.updatedBy || 'Operations Team'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PickupTracking;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/PickupTracking.jsx', trackingContent, 'utf8');
console.log('Updated PickupTracking.jsx');

// 4. Update RecyclingManagement.jsx
const recyclingContent = `import React, { useState, useEffect } from 'react';
import { useEwaste } from '../context/EwasteContext';
import { recyclingAPI } from '../api/api';
import { Factory, Leaf, ShieldCheck, MapPin, Gauge, Loader2, Sparkles } from 'lucide-react';

const RecyclingManagement = () => {
  const { requests, recyclingPartners } = useEwaste();
  const [batches, setBatches] = useState([]);
  const [centers, setCenters] = useState(recyclingPartners);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function loadRecyclingData() {
      setLoading(true);
      try {
        const [batchRes, centerRes] = await Promise.all([
          recyclingAPI.getBatches().catch(() => null),
          recyclingAPI.getCenters().catch(() => null)
        ]);

        if (batchRes?.batches) {
          setBatches(batchRes.batches);
        }
        if (centerRes?.centers?.length) {
          setCenters(centerRes.centers);
        }
      } catch (err) {
        console.warn('Recycling data load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRecyclingData();
  }, []);

  const inProcessing = batches.filter((b) => b.status === 'In Processing' || b.status === 'In Inspection');
  const completed = batches.filter((b) => b.status === 'Completed' || b.status === 'Materials Recovered' || b.status === 'Refurbished' || b.status === 'Safely Disposed');

  const filteredBatches = activeTab === 'All' ? batches : batches.filter(b => b.itemType === activeTab);

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Factory size={22} /> Recycling & Segregation Hub
        </h1>
        {loading && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />}
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Segregated handling of reusable components, recyclable precious metals, and hazardous substances
      </p>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}><Gauge size={22} /></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-title)' }}>{inProcessing.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active In Processing</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ color: '#10b981', marginBottom: '0.5rem' }}><Leaf size={22} /></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-title)' }}>{completed.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Batches Completed</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ color: '#059669', marginBottom: '0.5rem' }}><ShieldCheck size={22} /></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-title)' }}>{centers.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Certified Facilities</div>
        </div>
      </div>

      {/* Segregation Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['All', 'Reusable', 'Recyclable', 'Hazardous'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Batches Table */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2.5rem', overflow: 'auto' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-title)' }}>
          Recycling & Segregation Batches ({filteredBatches.length})
        </h2>
        {filteredBatches.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No batches registered for this category.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={thStyle}>Batch Number</th>
                <th style={thStyle}>Item Classification</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Facility</th>
                <th style={thStyle}>Recovery Rate</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}><strong>{b.batchNumber}</strong></td>
                  <td style={tdStyle}>
                    <div>{b.itemName}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: b.itemType === 'Hazardous' ? '#b91c1c' : b.itemType === 'Reusable' ? '#047857' : '#1e40af' }}>
                      [{b.itemType}]
                    </span>
                  </td>
                  <td style={tdStyle}>{b.weight} kg</td>
                  <td style={tdStyle}>{b.recyclerFacility}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '50px', height: '6px', borderRadius: '3px', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{ width: \`\${b.recoveryRate || 0}%\`, height: '100%', backgroundColor: '#10b981' }} />
                      </div>
                      <span>{b.recoveryRate}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#d1fae5', color: '#047857' }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Partners Grid */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-title)' }}>Certified Recycling Facilities</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {centers.map((p, idx) => (
          <div key={p.id || idx} className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>{p.name}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-body)', marginBottom: '0.5rem' }}>{p.specialization || p.specialty}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#059669', marginBottom: '0.35rem' }}>
              <ShieldCheck size={14} /> {p.licenseNumber || p.isoCertified || 'Certified Partner'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <MapPin size={14} /> {p.address ? \`\${p.address}, \${p.city}\` : p.city || p.location}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const thStyle = { textAlign: 'left', padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' };
const tdStyle = { padding: '0.65rem 0.75rem', color: 'var(--color-text-body)' };

export default RecyclingManagement;
`;

fs.writeFileSync('C:/Users/megha/my-website/src/pages/RecyclingManagement.jsx', recyclingContent, 'utf8');
console.log('Updated RecyclingManagement.jsx');

// 5. Update ReportsDashboard.jsx
const reportsContent = `import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api/api';
import { useEwaste } from '../context/EwasteContext';
import { BarChart3, Leaf, Recycle, TrendingUp, Weight, Loader2 } from 'lucide-react';

const ReportsDashboard = () => {
  const { requests } = useEwaste();
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [sumRes, monthRes, catRes] = await Promise.all([
          reportsAPI.getSummary().catch(() => null),
          reportsAPI.getMonthly().catch(() => null),
          reportsAPI.getCategories().catch(() => null)
        ]);

        if (sumRes?.summary) setSummary(sumRes.summary);
        if (monthRes?.monthlyData) setMonthlyData(monthRes.monthlyData);
        if (catRes?.categories) setCategories(catRes.categories);
      } catch (err) {
        console.warn('Reports load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const totalCollectedKg = summary?.totalWeightCollected || requests.reduce((s, r) => s + (parseFloat(r.weightKg) || 0), 0);
  const totalCO2Kg = summary?.environmentalImpact?.co2SavedKg || (totalCollectedKg * 1.85);
  const treesSaved = summary?.environmentalImpact?.treesSaved || (totalCollectedKg * 0.04);
  const energySaved = summary?.environmentalImpact?.energySavedKwh || (totalCollectedKg * 14.2);

  const maxCollected = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.weightKg || 1)) : 100;

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={22} /> Reports & Environmental Impact
        </h1>
        {loading && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />}
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Verified real-time statistics powered by Microsoft SQL Server database
      </p>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem', borderLeft: '4px solid #059669' }}>
          <Weight size={22} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{Number(totalCollectedKg).toFixed(1)} kg</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total E-Waste Collected</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <Recycle size={22} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{Number(summary?.reusableWeight || 0).toFixed(1)} kg</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Components Reused</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem', borderLeft: '4px solid #34d399' }}>
          <Leaf size={22} style={{ color: '#34d399', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{Number(totalCO2Kg).toFixed(1)} kg</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CO₂ Emissions Saved</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <TrendingUp size={22} style={{ color: '#3b82f6', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.totalRequests || requests.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Requests Processed</div>
        </div>
      </div>

      {/* Monthly Collection Bar Chart */}
      {monthlyData.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-title)' }}>
            Monthly Collection Trends (kg)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px', paddingBottom: '2rem' }}>
            {monthlyData.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.3rem' }}>
                  {m.weightKg}kg
                </div>
                <div style={{
                  width: '100%',
                  maxWidth: '60px',
                  borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(180deg, #10b981, #059669)',
                  height: \`\${Math.max(12, ((m.weightKg || 0) / maxCollected) * 100)}%\`,
                  transition: 'height 0.5s ease',
                  minHeight: '8px'
                }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', textAlign: 'center', fontWeight: 600 }}>
                  {m.monthName || m.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown table */}
      {categories.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', overflow: 'auto' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-title)' }}>
            Category Distribution & Environmental Impact
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Requests</th>
                <th style={thStyle}>Items Collected</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Hazard Rating</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}><strong>{c.categoryName}</strong></td>
                  <td style={tdStyle}>{c.requestCount}</td>
                  <td style={tdStyle}>{c.totalItems}</td>
                  <td style={tdStyle}>{c.totalWeightKg} kg</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: c.hazardousLevel === 'High' ? '#fee2e2' : c.hazardousLevel === 'Medium' ? '#fef3c7' : '#d1fae5',
                      color: c.hazardousLevel === 'High' ? '#b91c1c' : c.hazardousLevel === 'Medium' ? '#92400e' : '#047857'
                    }}>
                      {c.hazardousLevel || 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = { textAlign: 'left', padding: '0.65rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' };
const tdStyle = { padding: '0.65rem 0.75rem', color: 'var(--color-text-body)' };

export default ReportsDashboard;
`;
fs.writeFileSync('C:/Users/megha/my-website/src/pages/ReportsDashboard.jsx', reportsContent, 'utf8');
console.log('Updated ReportsDashboard.jsx');
