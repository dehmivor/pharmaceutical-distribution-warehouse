const express = require('express');

const quantityRoutes = (app) => {
  const router = express.Router();

  // Create a new quantity
  router.post('/quantities', (req, res) => {
    res.send('Create a new quantity');
  });

  // Retrieve all quantities
  router.get('/quantities', (req, res) => {
    res.send('Retrieve all quantities');
  });

  // Retrieve a single quantity by ID
  router.get('/quantities/:id', (req, res) => {
    res.send(`Retrieve a single quantity by ID: ${req.params.id}`);
  });

  // Update a quantity by ID
  router.put('/quantities/:id', (req, res) => {
    res.send(`Update a quantity by ID: ${req.params.id}`);
  });

  // Delete a quantity by ID
  router.delete('/quantities/:id', (req, res) => {
    res.send(`Delete a quantity by ID: ${req.params.id}`);
  });

  app.use('/api/quantities', router);
};

module.exports = quantityRoutes;
