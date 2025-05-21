const mongoose = require('mongoose');
const supplierSchema = new mongoose.Schema({
  name: String,
  address: String,
  contact_person: String,
  contact_email: String,
  phone: String,
  tax_code: String,
});

module.exports = mongoose.model('Supplier', supplierSchema);
