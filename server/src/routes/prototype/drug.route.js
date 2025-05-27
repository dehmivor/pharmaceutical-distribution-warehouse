const express = require('express');
const router = express.Router();
const Drug = require('../../models/drug.model.js');

// Middleware to validate drug data
const validateDrugData = (req, res, next) => {
  const { name, ingredient, category, price_import, price_sell } = req.body;

  if (!name || !ingredient || !category || price_import === undefined || price_sell === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (price_import < 0 || price_sell < 0) {
    return res.status(400).json({ message: 'Prices cannot be negative' });
  }

  next();
};

// GET all drugs
router.get('/', async (req, res) => {
  try {
    const drugs = await Drug.find();
    res.json(drugs);
    console.log(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific drug by ID
router.get('/:id', async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    res.json(drug);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new drug
router.post('/', validateDrugData, async (req, res) => {
  const drug = new Drug({
    code: req.body.code,
    name: req.body.name,
    ingredient: req.body.ingredient,
    unit: req.body.unit,
    manufacturer: req.body.manufacturer,
    category: req.body.category,
    price_import: req.body.price_import,
    price_sell: req.body.price_sell,
    prescription_required: req.body.prescription_required || false,
    quantity: req.body.quantity || 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  try {
    const newDrug = await drug.save();
    res.status(201).json(newDrug);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a drug
router.put('/:id', validateDrugData, async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    // Cập nhật các trường nếu có trong body
    if (req.body.code !== undefined) drug.code = req.body.code;
    if (req.body.name !== undefined) drug.name = req.body.name;
    if (req.body.ingredient !== undefined) drug.ingredient = req.body.ingredient;
    if (req.body.unit !== undefined) drug.unit = req.body.unit;
    if (req.body.manufacturer !== undefined) drug.manufacturer = req.body.manufacturer;
    if (req.body.category !== undefined) drug.category = req.body.category;
    if (req.body.price_import !== undefined) drug.price_import = req.body.price_import;
    if (req.body.price_sell !== undefined) drug.price_sell = req.body.price_sell;
    if (req.body.prescription_required !== undefined)
      drug.prescription_required = req.body.prescription_required;
    if (req.body.quantity !== undefined) drug.quantity = req.body.quantity;
    if (req.body.location !== undefined) drug.location = req.body.location;
    if (req.body.locationVerified !== undefined) drug.locationVerified = req.body.locationVerified;

    drug.updated_at = new Date();

    const updatedDrug = await drug.save();
    res.json(updatedDrug);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update specific fields of a drug
router.patch('/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date() };
    const drug = await Drug.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    res.json(drug);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a drug
router.delete('/:id', async (req, res) => {
  try {
    const drug = await Drug.findByIdAndDelete(req.params.id);

    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    res.json({ message: 'Drug deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET drugs by category
router.get('/category/:category', async (req, res) => {
  try {
    const drugs = await Drug.find({ category: req.params.category });
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET drugs that require prescription
router.get('/prescription/required', async (req, res) => {
  try {
    const drugs = await Drug.find({ prescription_required: true });
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET drugs with low stock (quantity below threshold)
router.get('/inventory/low', async (req, res) => {
  const threshold = req.query.threshold || 10;

  try {
    const drugs = await Drug.find({ quantity: { $lt: threshold } });
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update drug quantity (for inventory management)
router.put('/:id/quantity', async (req, res) => {
  if (req.body.quantity === undefined) {
    return res.status(400).json({ message: 'Quantity is required' });
  }

  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    drug.quantity = req.body.quantity;
    drug.updated_at = new Date();

    const updatedDrug = await drug.save();
    res.json(updatedDrug);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Search drugs by name or ingredient
router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const drugs = await Drug.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { ingredient: { $regex: query, $options: 'i' } },
      ],
    });

    res.json(drugs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  drugRoutes: router,
};
