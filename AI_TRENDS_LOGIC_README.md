# AI Trends Logic - Logic áp dụng AI vào xu hướng thị trường

## 🚀 **Tổng quan hệ thống AI Trends:**

Hệ thống AI Trends là một giải pháp thông minh sử dụng **Machine Learning** và **AI** để phân tích xu hướng thị trường dược phẩm, dự đoán nhu cầu thuốc và đưa ra gợi ý kinh doanh thông minh.

## 🧠 **Kiến trúc AI Trends:**

### **1. Service Layer (Tầng dịch vụ):**

- **`aiTrendsService.js`**: Core AI logic, algorithms, và business intelligence
- **`aiTrendsDatabaseService.js`**: Quản lý dữ liệu AI predictions và recommendations
- **`openaiService.js`**: Tích hợp OpenAI GPT để tăng cường phân tích

### **2. Controller Layer (Tầng điều khiển):**

- **`aiTrendsController.js`**: Xử lý HTTP requests và responses
- **Quản lý các endpoint AI khác nhau**

### **3. Data Layer (Tầng dữ liệu):**

- **`AIPrediction.js`**: Model lưu trữ predictions và recommendations
- **Database indexes**: Tối ưu hóa query performance

## 🔍 **Logic AI chính:**

### **A. Dự đoán nhu cầu thuốc (Medicine Demand Prediction):**

#### **1. Thuật toán Linear Regression:**

```javascript
// Sử dụng thư viện 'regression' để thực hiện linear regression
const result = regression.linear(data);
const { equation, r2 } = result;

// Dự đoán cho các tháng tới
for (let i = 0; i < months; i++) {
  const monthIndex = exportHistory.length + i;
  const predictedQuantity = Math.max(
    0,
    Math.round(equation[0] * monthIndex + equation[1])
  );

  predictions.push({
    month: moment()
      .add(i + 1, "months")
      .format("YYYY-MM"),
    predictedQuantity,
    confidence: Math.min(0.95, Math.max(0.5, r2)),
  });
}
```

#### **2. Xử lý dữ liệu lịch sử:**

- **Lấy lịch sử xuất hàng** trong 12 tháng gần nhất
- **Aggregate data** theo tháng để có dữ liệu chuẩn
- **Validation** dữ liệu (cần ít nhất 3 tháng để có dự đoán chính xác)

#### **3. Fallback mechanism:**

```javascript
if (exportHistory.length < 3) {
  // Sử dụng dự đoán mặc định nếu không đủ dữ liệu
  const defaultPrediction = this.generateDefaultPrediction(
    medicineId,
    months,
    medicine.medicine_name
  );
  return defaultPrediction;
}
```

### **B. Phân tích xu hướng thị trường (Market Trends Analysis):**

#### **1. Thu thập tin tức thực tế:**

```javascript
// Lấy tin tức từ các nguồn chính thức Việt Nam
const realNews = await NewsService.getAllNews();

// Phân loại tin tức theo loại
const vietnamHealthAlerts = realNews.filter(
  (news) => news.type === "health_policy" || news.type === "hospital_update"
);

const vietnamDrugUpdates = realNews.filter(
  (news) => news.type === "drug_regulation" || news.type === "industry_update"
);
```

#### **2. Phân tích theo vùng miền:**

- **Bộ Y tế**: Chính sách y tế mới
- **Cục Quản lý Dược**: Quy định dược phẩm
- **Bệnh viện**: Cập nhật điều trị
- **Hiệp hội Dược phẩm**: Xu hướng ngành

### **C. Gợi ý nhập thuốc thông minh (Smart Import Recommendations):**

#### **1. Logic ưu tiên:**

```javascript
// Tính toán thời gian tồn kho hiện tại
const monthsOfStock = currentStock.totalQuantity / (totalPredictedDemand / 3);

if (monthsOfStock < 2) {
  // Cần nhập gấp - tồn kho dưới 2 tháng
  recommendations.push({
    priority: "high",
    urgency: "immediate",
    reason: "Low stock level - below 2 months supply",
  });
} else if (monthsOfStock < 4) {
  // Cần nhập sớm - tồn kho dưới 4 tháng
  recommendations.push({
    priority: "medium",
    urgency: "within_month",
  });
}
```

#### **2. Tính toán chi phí:**

```javascript
// Ước tính chi phí nhập thuốc dựa trên giá trung bình
const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
return Math.round(averagePrice * quantity);
```

### **D. Phát hiện bất thường (Anomaly Detection):**

#### **1. Statistical Analysis:**

```javascript
// Tính toán độ lệch chuẩn
const quantities = prediction.historicalData.map((item) => item.totalQuantity);
const mean = ss.mean(quantities);
const standardDeviation = ss.standardDeviation(quantities);

// Phát hiện outliers (dữ liệu nằm ngoài 2 standard deviations)
const outliers = quantities.filter(
  (qty) => Math.abs(qty - mean) > 2 * standardDeviation
);
```

#### **2. Phân loại mức độ nghiêm trọng:**

- **High**: Nhiều outliers (>2)
- **Medium**: Một số outliers (1-2)
- **Low**: Ít hoặc không có outliers

## 🤖 **Tích hợp OpenAI:**

### **A. Market Trends với AI:**

```javascript
static async analyzeMarketTrendsWithAI() {
  try {
    const openaiService = new OpenAIService();

    if (!openaiService.isAvailable()) {
      // Fallback về phương pháp truyền thống
      return await this.analyzeMarketTrends();
    }

    // Gọi OpenAI để phân tích
    const aiAnalysis = await openaiService.analyzeMarketTrendsWithAI(marketData);

    return {
      analysis: aiAnalysis,
      source: 'OpenAI GPT-3.5',
      confidence: 'high'
    };
  } catch (error) {
    // Fallback nếu OpenAI fail
    return await this.analyzeMarketTrends();
  }
}
```

### **B. Import Recommendations với AI:**

```javascript
static async generateImportRecommendationsWithAI() {
  try {
    // Lấy dữ liệu kho và bán hàng
    const inventoryData = await this.getInventoryDataForAI();
    const salesData = await this.getSalesDataForAI();

    // Gọi OpenAI để tạo gợi ý
    const aiRecommendations = await openaiService.generateImportRecommendationsWithAI(
      inventoryData, salesData
    );

    return {
      recommendations: aiRecommendations,
      source: 'OpenAI GPT-3.5',
      confidence: 'high'
    };
  } catch (error) {
    // Fallback về phương pháp truyền thống
    return await this.generateImportRecommendations();
  }
}
```

## 📊 **Database Schema AI:**

### **A. AIPrediction Model:**

```javascript
const aiPredictionSchema = new mongoose.Schema({
  // Thông tin cơ bản
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true,
  },
  prediction_type: {
    type: String,
    enum: ["demand", "market_trend", "anomaly", "import_recommendation"],
  },

  // Dữ liệu dự đoán
  predictions: [
    {
      month: String,
      predictedQuantity: Number,
      confidence: { type: Number, min: 0, max: 1 },
    },
  ],

  // Thông tin xu hướng
  trend: { type: String, enum: ["increasing", "decreasing", "stable"] },
  overall_confidence: { type: Number, min: 0, max: 1 },

  // Thuật toán sử dụng
  algorithm: {
    type: String,
    enum: [
      "linear_regression",
      "arima",
      "prophet",
      "lstm",
      "default_prediction",
    ],
  },

  // Metadata
  generated_at: { type: Date, default: Date.now },
  valid_until: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "expired", "archived"],
    default: "active",
  },
});
```

### **B. Indexes tối ưu:**

```javascript
// Indexes để tối ưu query
aiPredictionSchema.index({ medicine_id: 1, prediction_type: 1, status: 1 });
aiPredictionSchema.index({ generated_at: -1 });
aiPredictionSchema.index({ valid_until: 1 });
aiPredictionSchema.index({ trend: 1, overall_confidence: -1 });
```

## 🔄 **Workflow AI Trends:**

### **1. Data Collection (Thu thập dữ liệu):**

```
Export Orders → Historical Sales Data → Medicine Performance
Import Orders → Inventory Levels → Stock Status
Contracts → Supplier Information → Pricing Data
News Sources → Market Updates → Policy Changes
```

### **2. Data Processing (Xử lý dữ liệu):**

```
Raw Data → Data Cleaning → Feature Engineering → Model Input
Historical Data → Time Series Analysis → Trend Detection
Market News → Content Analysis → Impact Assessment
```

### **3. AI Analysis (Phân tích AI):**

```
Linear Regression → Demand Prediction → Confidence Scoring
Statistical Analysis → Anomaly Detection → Severity Classification
OpenAI Integration → Market Insights → Business Recommendations
```

### **4. Results Generation (Tạo kết quả):**

```
Predictions → Database Storage → API Endpoints → Frontend Display
Recommendations → Priority Ranking → Action Items → Business Decisions
Market Trends → Risk Assessment → Opportunity Identification
```

## 📈 **Các thuật toán AI được sử dụng:**

### **1. Linear Regression:**

- **Mục đích**: Dự đoán nhu cầu thuốc theo thời gian
- **Ưu điểm**: Đơn giản, hiệu quả cho dữ liệu có xu hướng tuyến tính
- **Nhược điểm**: Không xử lý được mùa vụ và biến động phức tạp

### **2. Statistical Analysis:**

- **Mean, Standard Deviation**: Tính toán giá trị trung bình và độ biến động
- **Outlier Detection**: Phát hiện dữ liệu bất thường
- **Trend Analysis**: Phân tích xu hướng tăng/giảm/ổn định

### **3. Time Series Analysis:**

- **Monthly Aggregation**: Tổng hợp dữ liệu theo tháng
- **Seasonal Patterns**: Nhận diện mẫu theo mùa
- **Forecasting**: Dự đoán tương lai dựa trên lịch sử

## 🎯 **Ứng dụng thực tế:**

### **A. Quản lý tồn kho thông minh:**

- **Auto-replenishment**: Tự động gợi ý nhập hàng khi tồn kho thấp
- **Demand Forecasting**: Dự đoán nhu cầu để tối ưu hóa tồn kho
- **Cost Optimization**: Giảm thiểu chi phí lưu trữ và thiếu hụt

### **B. Chiến lược kinh doanh:**

- **Market Intelligence**: Hiểu biết xu hướng thị trường
- **Competitive Advantage**: Lợi thế cạnh tranh từ dữ liệu AI
- **Risk Management**: Quản lý rủi ro từ biến động thị trường

### **C. Quyết định nhập khẩu:**

- **Priority-based Import**: Nhập khẩu theo độ ưu tiên
- **Supplier Selection**: Chọn nhà cung cấp tối ưu
- **Timing Optimization**: Thời điểm nhập khẩu tối ưu

## 🔧 **Cách sử dụng API AI Trends:**

### **1. Dự đoán nhu cầu:**

```bash
GET /api/ai-trends/predictions/:medicineId?months=6
```

### **2. Gợi ý nhập khẩu:**

```bash
GET /api/ai-trends/recommendations
```

### **3. Xu hướng thị trường:**

```bash
GET /api/ai-trends/market-trends
```

### **4. Phát hiện bất thường:**

```bash
GET /api/ai-trends/anomalies
```

### **5. Báo cáo tổng hợp:**

```bash
GET /api/ai-trends/report
```

## 🚀 **Tính năng nâng cao:**

### **A. Real-time Updates:**

- **Cron Jobs**: Tự động cập nhật predictions hàng ngày
- **Webhook Integration**: Thông báo real-time khi có thay đổi
- **Live Dashboard**: Hiển thị dữ liệu real-time

### **B. Machine Learning Pipeline:**

- **Model Training**: Huấn luyện model với dữ liệu mới
- **Performance Monitoring**: Theo dõi độ chính xác của predictions
- **Auto-tuning**: Tự động điều chỉnh parameters

### **C. Advanced Analytics:**

- **Seasonal Decomposition**: Phân tích mùa vụ
- **Correlation Analysis**: Phân tích tương quan giữa các yếu tố
- **Predictive Maintenance**: Bảo trì dự đoán cho hệ thống

## ✅ **Kết luận:**

Hệ thống AI Trends là một giải pháp toàn diện kết hợp:

1. **Traditional ML**: Linear regression, statistical analysis
2. **Modern AI**: OpenAI GPT integration, advanced algorithms
3. **Real-time Data**: Live market data, news feeds
4. **Business Intelligence**: Actionable insights, recommendations
5. **Scalable Architecture**: Database optimization, API-first design

Hệ thống này giúp doanh nghiệp dược phẩm:

- **Tối ưu hóa tồn kho** với dự đoán chính xác
- **Giảm thiểu rủi ro** từ biến động thị trường
- **Tăng cường hiệu quả** trong quyết định kinh doanh
- **Duy trì lợi thế cạnh tranh** từ AI-powered insights
