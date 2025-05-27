const mongoose = require('mongoose');

const cycleCountFormSchema = new mongoose.Schema(
  {
    team: {
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Manager không được để trống'],
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'waiting_approval', 'completed', 'rejected'],
      default: 'pending',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'approvedBy không được để trống'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CycleCountForm = mongoose.model('CycleCountForm', cycleCountFormSchema);

module.exports = CycleCountForm;
