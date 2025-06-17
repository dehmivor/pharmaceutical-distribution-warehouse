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

const MEDICINE_TARGET_CUSTOMERS = {
    ALL: 'all',
    CHILDREN: 'children',
    ADULTS: 'adults',
    SENIORS: 'seniors',
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
};
