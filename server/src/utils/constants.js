// utils/constants.js
const USER_ROLES = {
    WAREHOUSE: 'warehouse',
    SUPERVISOR: 'supervisor',
    REPRESENTATIVE: 'representative',
    RETAILER: 'retailer',
    SUPPLIER: 'supplier',
};

const USER_STATUSES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const MEDICINE_DOSAGE_FORMS = {
    TABLET: 'tablet',
    CAPSULE: 'capsule',
    SYRUP: 'syrup',
    INJECTION: 'injection',
};

const MEDICINE_TARGET_CUSTOMERS = {
    ALL: 'all',
    CHILDREN: 'children',
    ADULTS: 'adults',
    SENIORS: 'seniors',
};

const MEDICINE_UNITS = {
    G: 'g',
    ML: 'ml',
    TABLET: 'tablet',
    BOTTLE: 'bottle',
    VIAL: 'vial',
    PACK: 'pack',
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

module.exports = {
  USER_ROLES,
  USER_STATUSES,
  MEDICINE_DOSAGE_FORMS,
  MEDICINE_TARGET_CUSTOMERS,
  MEDICINE_UNITS,
  BATCH_QUALITY_STATUSES,
  PACKAGE_STATUSES,
  PACKAGE_QUALITY_STATUSES,
  AREA_TYPES
};
