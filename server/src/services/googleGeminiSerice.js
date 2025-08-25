const medicineService = require("../services/medicineService");
const logLocationChangeService = require("../services/logLocationChangeService");



const quickresponse = async (licenseCode) => {
    try {
        if (!licenseCode || typeof licenseCode !== "string" || !licenseCode.trim()) {
            const err = new Error("licenseCode is required");
            err.status = 400;
            throw err;
        }
        const lc = licenseCode.trim();


        // Dynamically import the ESM package inside the async function
        const genaiMod = await import("@google/genai");
        // Named export
        const { GoogleGenAI } = genaiMod;
        const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

        // 1) fetch the two JSON payloads in parallel
        const [inventoryFlowResult, history6Result] = await Promise.all([
            medicineService.getInventoryFlowByLicenseCode(licenseCode),
            logLocationChangeService.getHistoryLast6MonthsByLicenseCode(licenseCode),
        ]);

        // 2) Build prompt for the AI
        // Ask explicitly for JSON-only response and give a strict schema
        const prompt = `
Bạn là một chuyên gia phân tích dữ liệu. Tôi sẽ cung cấp cho bạn HAI đối tượng JSON về một loại thuốc trong kho.

Đối tượng 1: inventoryFlow
${JSON.stringify(inventoryFlowResult, null, 2)}

Đối tượng 2: history6Months
${JSON.stringify(history6Result, null, 2)}

NHIỆM VỤ:
- Sử dụng hai đối tượng JSON này để tính toán và trả lời.
- Phần trả lời phải theo cấu trúc sau nhưng viết dễ đọc bằng tiếng Việt — **loại bỏ tất cả dấu ngoặc** để dễ đọc:

mặt hàng:
  mã thuốc: "<mã giấy phép đầu vào>",

tóm tắt: "<một câu tóm tắt ngắn gọn, thân thiện với người đọc>",

tính toán:
  tổng nhập khẩu trong 12 tháng: <số>,
  tổng xuất khẩu trong 12 tháng: <số>,
  thay đổi trong kho 12 tháng: <số>,
  trung bình nhập khẩu trong 12 tháng: <số>,
  trung bình xuất khẩu trong 12 tháng: <số>

đáng chú ý:
  - tiêu đề: "tiêu đề ngắn"
    nội dung: "một hoặc hai câu"

  - ...

khuyến nghị:
  - ưu tiên: "cao|trung bình|thấp"
    nội dung: "khuyến nghị hành động, rõ ràng và có thể thực hiện"

  - ...

QUY TẮC:
- Giữ "summary" ngắn (không quá 30 từ). "insights" và "recommendations" có thể là danh sách 1–5 mục.
- Khi có thể, tính các tổng từ các mảng đã cung cấp; **không** bịa dữ liệu.
- Không bao gồm bất kỳ bình luận thừa nào ngoài phần trả lời yêu cầu.

Bây giờ hãy tạo phần trả lời cho mã giấy phép: "${licenseCode}".
`;

        // 3) Call AI model (uses ai.models.generateContent as in your environment)
        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        const text = aiResponse?.text ?? aiResponse?.output?.[0]?.content ?? "";

        // return raw AI text but mark as unstructure

        return text;

    } catch (error) {
        console.error("Error in getMedicineStatistics:", error);
        const status = error?.status || 500;
        res.status(status).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

module.exports = {
    quickresponse
};

