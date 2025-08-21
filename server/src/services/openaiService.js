const axios = require('axios');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  // Kiểm tra API key có sẵn không
  isAvailable() {
    return !!this.apiKey;
  }

  // Gọi API OpenAI cơ bản
  async callOpenAI(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'Bạn là chuyên gia phân tích dữ liệu dược phẩm. Hãy trả lời bằng tiếng Việt một cách ngắn gọn và chính xác.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 giây timeout
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new Error('OpenAI API key không hợp lệ');
      } else if (error.response?.status === 429) {
        throw new Error('Đã vượt quá giới hạn API calls');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('OpenAI API timeout');
      } else {
        throw new Error('Lỗi khi gọi OpenAI API');
      }
    }
  }

  // Phân tích xu hướng thị trường với AI
  async analyzeMarketTrendsWithAI(marketData) {
    const prompt = `
      Phân tích xu hướng thị trường dược phẩm Việt Nam dựa trên dữ liệu:

      📊 THỐNG KÊ TỔNG QUAN:
      - Đơn hàng xuất: ${marketData.exportData?.length || 0}
      - Đơn hàng nhập: ${marketData.importData?.length || 0}
      - Doanh thu: ${marketData.totalRevenue?.toLocaleString() || 0} VND
      - Số thuốc: ${marketData.medicineCount || 0}

      🏥 TÌNH HÌNH DỊCH BỆNH:
      - Mùa dịch: ${marketData.seasonalDiseases || 'Không xác định'}
      - Bệnh phổ biến: ${marketData.commonDiseases || 'Không xác định'}

      💊 THUỐC TIÊU THỤ MẠNH:
      - Top thuốc: ${marketData.topSellingMedicines || 'Không xác định'}
      - Xu hướng: ${marketData.medicineTrends || 'Không xác định'}

      📈 DỰ ĐOÁN QUÝ TỚI:
      - Nhu cầu tăng: ${marketData.expectedDemand || 'Không xác định'}
      - Thuốc ưu tiên: ${marketData.priorityMedicines || 'Không xác định'}

      Hãy phân tích ngắn gọn:
      1. Xu hướng thị trường chính
      2. Tác động dịch bệnh
      3. Dự đoán quý tới
      4. Khuyến nghị kinh doanh

      Trả lời bằng tiếng Việt, format rõ ràng, tối đa 300 từ.
    `;

    return await this.callOpenAI(prompt, { max_tokens: 1000 });
  }

  // Tạo gợi ý nhập thuốc với AI
  async generateImportRecommendationsWithAI(inventoryData, salesData) {
    const prompt = `
      Gợi ý nhập thuốc dựa trên dữ liệu thực tế:

      📦 TÌNH TRẠNG KHO:
      - Tổng thuốc: ${inventoryData.totalMedicines || 0} loại
      - Thuốc sắp hết: ${inventoryData.lowStockMedicines || 0} loại
      - Thuốc bán chạy: ${salesData.topSellingMedicines || 0} loại
      - Mức độ ưu tiên: ${inventoryData.priorityLevel || 'Trung bình'}

      💊 THUỐC CẦN NHẬP:
      - Thuốc ưu tiên cao: ${inventoryData.highPriorityMedicines || 'Không xác định'}
      - Thuốc ưu tiên trung bình: ${inventoryData.mediumPriorityMedicines || 'Không xác định'}
      - Thuốc dự phòng: ${inventoryData.backupMedicines || 'Không xác định'}

      🏥 TÌNH HÌNH THỊ TRƯỜNG:
      - Mùa hiện tại: ${this.getCurrentSeason()}
      - Bệnh phổ biến: ${this.getSeasonalDiseases()}
      - Xu hướng tiêu thụ: ${salesData.consumptionTrend || 'Không xác định'}

      📈 KHUYẾN NGHỊ CHI TIẾT:
      Hãy đưa ra:
      1. Danh sách thuốc ưu tiên nhập (theo thứ tự)
      2. Lý do và mức độ ưu tiên cụ thể
      3. Số lượng khuyến nghị cho từng loại
      4. Thời gian nhập hàng tối ưu
      5. Chiến lược dự trữ thông minh

      Trả lời bằng tiếng Việt, format rõ ràng, tối đa 300 từ.
    `;

    return await this.callOpenAI(prompt, { max_tokens: 1000 });
  }

  // Dự đoán nhu cầu với AI
  async predictDemandWithAI(medicineData, historicalData) {
    const prompt = `
      Dự đoán nhu cầu thuốc dựa trên dữ liệu:

      💊 THÔNG TIN THUỐC:
      - Tên: ${medicineData.medicine_name || 'Không xác định'}
      - Tồn kho: ${medicineData.current_stock || 0} ${medicineData.unit_of_measure || 'đơn vị'}
      - Loại: ${medicineData.medicine_type || 'Không xác định'}

      📊 LỊCH SỬ BÁN HÀNG:
      - Bán 3 tháng gần nhất: ${historicalData.recentSales || 0} đơn vị
      - Xu hướng: ${historicalData.trend || 'Không xác định'}
      - Độ biến động: ${historicalData.volatility || 'Trung bình'}

      🏥 TÌNH HÌNH THỊ TRƯỜNG:
      - Mùa hiện tại: ${this.getCurrentSeason()}
      - Bệnh phổ biến: ${this.getSeasonalDiseases()}
      - Nhu cầu dự kiến: ${historicalData.expectedDemand || 'Không xác định'}

      📈 DỰ ĐOÁN 6 THÁNG TỚI:
      Hãy đưa ra:
      1. Số lượng cần thiết theo từng tháng
      2. Độ tin cậy dự đoán (cao/trung bình/thấp)
      3. Khuyến nghị nhập hàng cụ thể
      4. Lý do và yếu tố ảnh hưởng

      Trả lời bằng tiếng Việt, format rõ ràng, tối đa 200 từ.
    `;

    return await this.callOpenAI(prompt, { max_tokens: 800 });
  }

  // Lấy mùa hiện tại
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Mùa xuân';
    if (month >= 5 && month <= 7) return 'Mùa hè';
    if (month >= 8 && month <= 10) return 'Mùa thu';
    return 'Mùa đông';
  }

  // Lấy bệnh theo mùa
  getSeasonalDiseases() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Dị ứng, Hen suyễn, Viêm mũi';
    if (month >= 5 && month <= 7) return 'Tiêu chảy, Sốt xuất huyết, Viêm não';
    if (month >= 8 && month <= 10) return 'Sốt xuất huyết, Viêm não, Cảm cúm';
    return 'Cảm cúm, Viêm phổi, Hen suyễn';
  }

  // Phân tích bất thường với AI
  async analyzeAnomaliesWithAI(anomalyData) {
    const prompt = `
      Phân tích bất thường trong dữ liệu dược phẩm:

      📊 THỐNG KÊ BẤT THƯỜNG:
      - Số lượng: ${anomalyData.count || 0} trường hợp
      - Loại: ${anomalyData.types?.join(', ') || 'Không xác định'}
      - Mức độ: ${anomalyData.severity || 'Trung bình'}

      🏥 NGÀNH DƯỢC PHẨM:
      - Thời điểm: ${this.getCurrentSeason()}
      - Bệnh mùa: ${this.getSeasonalDiseases()}
      - Xu hướng thị trường: ${anomalyData.marketTrend || 'Không xác định'}

      📈 PHÂN TÍCH CHI TIẾT:
      Hãy đưa ra:
      1. Nguyên nhân chính gây bất thường
      2. Tác động đến hoạt động kinh doanh
      3. Biện pháp khắc phục cụ thể
      4. Khuyến nghị phòng ngừa
      5. Dự đoán xu hướng trong tương lai

      Trả lời bằng tiếng Việt, format rõ ràng, tối đa 250 từ.
    `;

    return await this.callOpenAI(prompt, { max_tokens: 800 });
  }
}

module.exports = OpenAIService;
