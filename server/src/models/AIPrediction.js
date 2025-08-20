const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  // Thông tin cơ bản
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  
  // Loại prediction
  prediction_type: {
    type: String,
    enum: ['demand', 'market_trend', 'anomaly', 'import_recommendation'],
    required: true
  },
  
  // Dữ liệu dự đoán
  predictions: [{
    month: {
      type: String,
      required: true
    },
    predictedQuantity: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    }
  }],
  
  // Thông tin xu hướng
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    required: true
  },
  
  // Độ tin cậy tổng thể
  overall_confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  
  // Thuật toán sử dụng
  algorithm: {
    type: String,
    enum: ['linear_regression', 'arima', 'prophet', 'lstm', 'default_prediction'],
    default: 'linear_regression'
  },
  
  // Dữ liệu lịch sử được sử dụng
  historical_data: [{
    year: Number,
    month: Number,
    totalQuantity: Number,
    orderCount: Number
  }],
  
  // Thông tin gợi ý nhập hàng (nếu có)
  import_recommendation: {
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    reason: String,
    recommendedQuantity: Number,
    urgency: {
      type: String,
      enum: ['immediate', 'within_month', 'within_quarter']
    },
    estimatedCost: Number,
    supplier: String
  },
  
  // Thông tin bất thường (nếu có)
  anomaly_data: {
    anomalyType: String,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    data: {
      mean: Number,
      standardDeviation: Number,
      outliers: [Number]
    }
  },
  
  // Metadata
  generated_at: {
    type: Date,
    default: Date.now
  },
  
  valid_until: {
    type: Date,
    required: true
  },
  
  status: {
    type: String,
    enum: ['active', 'expired', 'archived'],
    default: 'active'
  },
  
  // Thông tin người tạo
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags để phân loại
  tags: [String],
  
  // Ghi chú
  notes: String
}, {
  timestamps: true
});

// Indexes để tối ưu query
aiPredictionSchema.index({ medicine_id: 1, prediction_type: 1, status: 1 });
aiPredictionSchema.index({ generated_at: -1 });
aiPredictionSchema.index({ valid_until: 1 });
aiPredictionSchema.index({ trend: 1, overall_confidence: -1 });

// Virtual field để tính thời gian còn lại
aiPredictionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.valid_until - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Method để kiểm tra xem prediction có còn hợp lệ không
aiPredictionSchema.methods.isValid = function() {
  return this.status === 'active' && this.valid_until > new Date();
};

// Method để archive prediction cũ
aiPredictionSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method để lấy predictions hợp lệ
aiPredictionSchema.statics.getValidPredictions = function(medicineId, predictionType) {
  return this.find({
    medicine_id: medicineId,
    prediction_type: predictionType,
    status: 'active',
    valid_until: { $gt: new Date() }
  }).sort({ generated_at: -1 });
};

// Static method để cleanup predictions cũ
aiPredictionSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    { valid_until: { $lt: new Date() }, status: 'active' },
    { status: 'expired' }
  );
  return result;
};

// Pre-save middleware để tự động set valid_until nếu không có
aiPredictionSchema.pre('save', function(next) {
  if (!this.valid_until) {
    // Mặc định prediction có hiệu lực trong 30 ngày
    this.valid_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('AIPrediction', aiPredictionSchema);
