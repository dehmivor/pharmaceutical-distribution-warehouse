const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  tag_number: Number,
  tag_description: String,
});

module.exports = mongoose.model('Role', roleSchema);
// const mongoose = require('mongoose');
