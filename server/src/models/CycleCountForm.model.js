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
    startTime: {
      type: Date,
      required: [true, 'thời gian bắt đầu kiểm kê không được để trống'],
    },
    endTime: {
      type: Date,
      required: [true, 'thời gian kết thúc kiểm kê không được để trống'],
    },
    content: [
      {
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Location',
          required: [true, 'Manager không được để trống'],
        },
        verified: {
          type: Boolean,
          default: false,
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee'
        },
        result: [
          {
            Package: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Package',
              required: [true, 'content của cycle count form không được để trống'],
            },
            Status: {
              type: String,
              enum: ['lost', 'in_place', 'damaged', 'pending'],
              default: 'pending',
            }
          },

        ]
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CycleCountForm = mongoose.model('CycleCountForm', cycleCountFormSchema);

module.exports = CycleCountForm;
