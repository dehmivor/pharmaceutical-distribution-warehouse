// utils/constants.js
const USER_ROLES = {
    WAREHOUSE: 'warehouse',
    SUPERVISOR: 'supervisor',
    REPRESENTATIVE: 'representative',
    MANAGER: 'manager',
};

const USER_STATUSES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const MEDICINE_CATERGORY = {
    THUOC_KHONG_KE_DON : 'thuốc không kê đơn',
    THUOC_GAY_NGHIEN: 'Thuốc gây nghiện',
    THUOC_HUONG_TAM_THAN_VA_TIEN_CHAT_DUNG_LAM_THUOC: 'Thuốc hướng tâm thần và tiền chất dùng làm thuốc',
    THUOC_GIAM_DAU,CHONG_VIEM: 'Thuốc giảm đau, chống viêm không steroid trừ acetylsalicylic acid (Aspirin) và paracetamol',
    THUOC_DIEU_TRI_BENH_GUT: 'Thuốc điều trị bệnh Gút',
    THUOC_CAP_CUU_VA_CHONG_DOC: 'Thuốc cấp cứu và chống độc',
    THUOC_DIEU_TRI_GIUN_CHI_SAN_LA: 'Thuốc điều trị giun chỉ, sán lá',
    THUOC_KHANG_SINH: 'Thuốc kháng sinh',
    THUOC_DIEU_TRI_VIRUT: 'Thuốc điều trị virút',
    THUOC_DIEU_TRI_NAM: 'Thuốc điều trị nấm',
    THUOC_DIEU_TRI_LAO: 'Thuốc điều trị lao',
    THUOC_DIEU_TRI_SOT_RET: 'Thuốc điều trị sốt rét',
    THUOC_DIEU_TRI_DAU_NUA_DAU: 'Thuốc điều trị đau nửa đầu (Migraine)',
    THUOC_DIEU_TRI_UNG_THU_VA_TAC_DONG_VAO_HE_THONG_MIEN_DICH: 'Thuốc điều trị ung thư và tác động vào hệ thống miễn dịch',
    THUOC_DIEU_TRI_PARKINSON: 'Thuốc điều trị parkinson',
    THUOC_TAC_DONG_LEN_QUA_TRINH_DONG_MAU: 'Thuốc tác động lên quá trình đông máu',
    MAU_CHE_PHAM_MAU_DUNG_DICH_CAO_PHAN_TU: 'Máu, chế phẩm máu, dung dịch cao phân tử',
    NHOM_THUOC_TIM_MACH: 'Nhóm thuốc tim mạch',
    THUOC_DUNG_CHO_CHAN_DOAN: 'Thuốc dùng cho chẩn đoán',
    THUOC_LOI_TIEU: 'Thuốc lợi tiểu',
    THUOC_CHONG_LOET_DA_DAY: 'Thuốc chống loét dạ dày: thuốc kháng histamin H2, thuốc ức chế bơm proton',
    HOC_MON_VA_NOI_TIET_TO: 'Hoc môn (corticoide, insulin và nhóm hạ đường huyết, …) và nội tiết tố (trừ thuốc tránh thai);',
    HUYET_THAN_VA_GLOBULIN_MIENG_DICH: 'Huyết thanh và globulin miễn dịch',
    THUOC_GIAN_CO_VA_TANG_TRUONG_LUC_CO: 'Thuốc giãn cơ và tăng trương lực cơ',
    THUOC_LAM_CO_DAN_DONG_TU_VA_GIAM_NHAN_AP: 'Thuốc làm co, dãn đồng tử và giảm nhãn áp',
    THUOC_THUC_DE_CAM_MAU_SAU_DE_VA_CHONG_DE_NON: 'Thuốc thúc đẻ, cầm máu sau đẻ và chống đẻ non',
    THUOC_DIEU_TRI_HEN: 'Thuốc điều trị hen',
    SINH_PHAM_DUNG_CHUA_BENH: 'Sinh phẩm dùng chữa bệnh (trừ men tiêu hoá)',
    THUOC_DIEU_TRI_ROI_LOAN_CUONG: 'Thuốc điều trị rối loạn cương',
    DUNG_DICH_TRUYEN_TINH_MACH: 'Dung dịch truyền tĩnh mạch',
};

const BATCH_QUALITY_STATUSES = {
  PASS: 'pass',
  FAILED: 'failed',
  PENDING: 'pending',
};

const PACKAGE_STATUSES = {
  CHECKING: 'checking',
  CANCEL: 'cancel',
  NORMAL: 'normal',
};

const PACKAGE_QUALITY_STATUSES = {
  PASS: 'pass',
  PARTIAL: 'partial',
  FAILED: 'failed',
};

const AREA_TYPES = {
  COLD_STORAGE: 'cold_storage',
  DRY_STORAGE: 'dry_storage',
  HAZARDOUS: 'hazardous',
};

const CONTRACT_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const IMPORT_ORDER_STATUSES = {
  WAITING_APPROVAL: 'waiting_approval',
  APPROVED: 'approved',
  CARRIER_ARRIVED: 'carrier_arrived',
  CHECKED_IN : 'checked_in',
  COMPLETED : 'completed',
  CANCELLED: 'cancelled',
};


const PURCHASE_ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  CANCELLED: 'cancelled',
};

const INSPECTION_QUALITY_STATUSES = {
  PASS: 'pass',
  FAILED: 'failed',
  PARTIAL: 'partial',
};

const INSPECTION_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

module.exports = {
  USER_ROLES,
  USER_STATUSES,
  MEDICINE_DOSAGE_FORMS,
  MEDICINE_TARGET_CUSTOMERS,
  MEDICINE_UNITS,
  BATCH_QUALITY_STATUSES,
  PACKAGE_STATUSES,
  PACKAGE_QUALITY_STATUSES,
  AREA_TYPES,
  CONTRACT_STATUSES,
  IMPORT_ORDER_STATUSES,
  INSPECTION_QUALITY_STATUSES,
  INSPECTION_STATUSES,
  MEDICINE_CATERGORY,
  PURCHASE_ORDER_STATUSES
};
