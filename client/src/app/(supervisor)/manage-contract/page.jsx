import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';



// Supervisor Contract Manager Screen
export function ContractManager() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all contracts
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data } = await axios.get('/api/contracts');
        setContracts(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/contracts/${id}/status`, { status });
      setContracts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading) return <p>Loading contracts...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="p-4">
      <h2>Contract Manager</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Partner</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c._id}>
              <td>{c.contract_code}</td>
              <td>{c.type}</td>
              <td>
                {c.partner_type === 'supplier' ? c.supplier.name : c.retailer.name}
              </td>
              <td>{new Date(c.start_date).toLocaleDateString()}</td>
              <td>{new Date(c.end_date).toLocaleDateString()}</td>
              <td>{c.status}</td>
              <td>
                {c.status === 'draft' && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => updateStatus(c._id, 'active')}
                      className="me-2"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateStatus(c._id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
