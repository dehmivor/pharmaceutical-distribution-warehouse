'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';

export default function NewContract() {
  const [form, setForm] = useState({
    contract_code: '',
    type: 'supply',
    partner_type: 'supplier',
    supplier_id: null,
    retailer_id: null,
    start_date: '',
    end_date: '',
    status: 'draft',
  });

  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [retailerQuery, setRetailerQuery] = useState('');
  const [retailerResults, setRetailerResults] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('supplier');
  const [newName, setNewName] = useState('');

  // search helper
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!supplierQuery) return setSupplierResults([]);
      const { data } = await axios.get(`/api/users/search`, { params: { role: 'supplier', q: supplierQuery } });
      setSupplierResults(data);
    };
    const delay = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delay);
  }, [supplierQuery]);

  useEffect(() => {
    const fetchRetailers = async () => {
      if (!retailerQuery) return setRetailerResults([]);
      const { data } = await axios.get(`/api/users/search`, { params: { role: 'retailer', q: retailerQuery } });
      setRetailerResults(data);
    };
    const delay = setTimeout(fetchRetailers, 300);
    return () => clearTimeout(delay);
  }, [retailerQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSelect = (role, user) => {
    setForm((f) => ({ ...f, [`${role}_id`]: user._id }));
    if (role === 'supplier') setSupplierQuery(user.name);
    else setRetailerQuery(user.name);
  };

  const openModal = (role) => {
    setModalType(role);
    setNewName('');
    setShowModal(true);
  };

  const handleModalSave = async () => {
    const { data } = await axios.post(`/api/${modalType}s`, { name: newName });
    handleSelect(modalType, data);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contracts', form);
      alert('Contract created!');
      // redirect or clear
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Row className="justify-content-center mt-4">
      <Col md={8}>
        <h2>New Contract</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="contract_code" className="mb-3">
            <Form.Label>Contract Code</Form.Label>
            <Form.Control
              name="contract_code"
              value={form.contract_code}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="type" className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select name="type" value={form.type} onChange={handleChange}>
              <option value="supply">Supply</option>
              <option value="distribution">Distribution</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="partner_type" className="mb-3">
            <Form.Label>Partner Type</Form.Label>
            <Form.Select name="partner_type" value={form.partner_type} onChange={handleChange}>
              <option value="supplier">Supplier</option>
              <option value="retailer">Retailer</option>
            </Form.Select>
          </Form.Group>

          {/* Supplier */}
          <Form.Group controlId="supplier" className="mb-3">
            <Form.Label>Supplier</Form.Label>
            <div className="d-flex">
              <Form.Control
                placeholder="Search supplier..."
                value={supplierQuery}
                onChange={(e) => setSupplierQuery(e.target.value)}
              />
              <Button variant="secondary" onClick={() => openModal('supplier')} className="ms-2">
                Add New
              </Button>
            </div>
            {supplierResults.map((u) => (
              <Button
                key={u._id}
                variant={form.supplier_id === u._id ? 'primary' : 'light'}
                onClick={() => handleSelect('supplier', u)}
                className="me-1 mt-1"
              >
                {u.name}
              </Button>
            ))}
          </Form.Group>

          {/* Retailer */}
          <Form.Group controlId="retailer" className="mb-3">
            <Form.Label>Retailer</Form.Label>
            <div className="d-flex">
              <Form.Control
                placeholder="Search retailer..."
                value={retailerQuery}
                onChange={(e) => setRetailerQuery(e.target.value)}
              />
              <Button variant="secondary" onClick={() => openModal('retailer')} className="ms-2">
                Add New
              </Button>
            </div>
            {retailerResults.map((u) => (
              <Button
                key={u._id}
                variant={form.retailer_id === u._id ? 'primary' : 'light'}
                onClick={() => handleSelect('retailer', u)}
                className="me-1 mt-1"
              >
                {u.name}
              </Button>
            ))}
          </Form.Group>

          <Row>
            <Col>
              <Form.Group controlId="start_date" className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="end_date" className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Button type="submit">Create Contract</Button>
        </Form>

        {/* Modal for adding new supplier/retailer */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group controlId="newName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalSave} disabled={!newName.trim()}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
}
