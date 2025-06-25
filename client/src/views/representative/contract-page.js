'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ContractPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const res = await axios.get('http://localhost:5000/api/accounts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const warehouseManagers = res.data.data.filter((account) => account.role === 'warehouse_manager');

        setAccounts(warehouseManagers);
        console.log(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Danh sách tài khoản</h2>
      <ul>
        {accounts.map((account) => (
          <li key={account._id}>
            {/* Sửa tại đây: dùng account.email thay vì username */}
            {account.email} - {account.role}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContractPage;
