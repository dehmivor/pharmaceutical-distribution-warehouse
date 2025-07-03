'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function QualityCheckPage({ id }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // wrap fetch in a useCallback so we can call it from both useEffect and the button
  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .get(`${backendUrl}/cyclecountform/${id}`)
      .then((res) => setForm(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p>Loading form…</p>;
  if (!form) return <p>Form not found.</p>;

  // check if *all* content items are verified
  const allVerified = form.content.every((item) => item.verified === true);

  const handleSend = () => {
    setUpdating(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .patch(`${backendUrl}/cyclecountform/${id}/status`, { status: 'waiting_approval' })
      .then(() => {
        setForm((f) => ({ ...f, status: 'waiting_approval' }));
      })
      .catch(console.error)
      .finally(() => setUpdating(false));
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      {/* Refresh Button */}
      <button
        onClick={fetchData}
        disabled={loading}
        style={{
          marginBottom: 20,
          padding: '8px 16px',
          background: '#eee',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>

      <h1>Cycle Count Form Detail</h1>
      <p>
        <strong>Manager:</strong> {form.team.manager}
      </p>
      <p>
        <strong>Members:</strong> {form.team.members.join(', ') || '–'}
      </p>
      <p>
        <strong>Status:</strong> {form.status}
      </p>
      <p>
        <strong>Start:</strong> {new Date(form.startTime).toLocaleString()}
      </p>
      <p>
        <strong>End:</strong> {new Date(form.endTime).toLocaleString()}
      </p>

      <h2>Content</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Location</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Verified</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Package ID</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Result Status</th>
          </tr>
        </thead>
        <tbody>
          {form.content.map((c, i) => (
            <tr key={i}>
              <td style={{ padding: '4px 8px' }}>{c.location}</td>
              <td style={{ padding: '4px 8px' }}>{c.verified ? '✔️' : '❌'}</td>
              <td style={{ padding: '4px 8px' }}>{c.result[0].Package}</td>
              <td style={{ padding: '4px 8px' }}>{c.result[0].Status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSend}
        disabled={!allVerified || updating || form.status !== 'in_progress'}
        style={{
          marginTop: 20,
          padding: '10px 20px',
          background: allVerified && form.status === 'in_progress' ? '#0070f3' : '#999',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: allVerified && form.status === 'in_progress' ? 'pointer' : 'not-allowed'
        }}
      >
        {updating ? 'Sending…' : 'Send to Supervisor'}
      </button>
    </div>
  );
}
