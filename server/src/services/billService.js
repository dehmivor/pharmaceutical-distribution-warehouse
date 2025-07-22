const Bill = require('../models/Bill');

const getAllBills = async () => {
  try {
    const bills = await Bill.find()
      .populate({
        path: 'import_order_id',
        select: 'contract_id warehouse_manager_id status created_by approval_by details',
        populate: [
          {
            path: 'contract_id',
            select: 'contract_name',
            model: 'Contract',
          },
          {
            path: 'warehouse_manager_id',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'created_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'approval_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'details.medicine_id',
            select: 'medicine_name license_code',
            model: 'Medicine',
          },
        ],
      })
      .populate({
        path: 'export_order_id',
        select: 'contract_id warehouse_manager_id status created_by approval_by details',
        populate: [
          {
            path: 'contract_id',
            select: 'contract_name',
            model: 'Contract',
          },
          {
            path: 'warehouse_manager_id',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'created_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'approval_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'details.medicine_id',
            select: 'medicine_name license_code',
            model: 'Medicine',
          },
        ],
      })
      .populate({
        path: 'details.medicine_lisence_code', // Không đúng vì không phải ObjectId
        // Cách này không được vì medicine_lisence_code là String
        // Nếu muốn thông tin Medicine, bạn cần xử lý thủ công sau khi query hoặc thay thế details.medicine_lisence_code bằng medicine_id (ObjectId)
      });

    // Nếu bạn cần thông tin medicine cho details trong Bill (mà details chứa medicine_lisence_code):
    // Bạn có thể map lại bills để join thủ công thông tin medicine từ collection Medicine

    return bills;
  } catch (error) {
    throw error;
  }
};

const getBillById = async (billId) => {
  try {
    if (!billId) throw new Error('Missing billId parameter');

    const bill = await Bill.findById(billId)
      .populate({
        path: 'import_order_id',
        select: 'supplier_contract_id warehouse_manager_id status created_by approval_by details',
        populate: [
          {
            path: 'supplier_contract_id',
            select: 'contract_name',
            model: 'SupplierContract',
          },
          {
            path: 'warehouse_manager_id',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'created_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'approval_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'details.medicine_id',
            select: 'medicine_name license_code',
            model: 'Medicine',
          },
        ],
      })
      .populate({
        path: 'export_order_id',
        select: 'contract_id warehouse_manager_id status created_by approval_by details',
        populate: [
          {
            path: 'contract_id',
            select: 'contract_name',
            model: 'Contract',
          },
          {
            path: 'warehouse_manager_id',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'created_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'approval_by',
            select: 'name email',
            model: 'User',
          },
          {
            path: 'details.medicine_id',
            select: 'medicine_name license_code',
            model: 'Medicine',
          },
        ],
      })
      .populate({
        path: 'details',
        populate: {
          path: 'medicine_id',
          select: 'medicine_name license_code',
          model: 'Medicine',
        },
      });

    return bill;
  } catch (error) {
    throw error;
  }
};

const createBill = async (billData) => {
  try {
    const bill = await Bill.create(billData);
    return bill;
  } catch (error) {
    throw error;
  }
};

const deleteBill = async (billId) => {
  try {
    const bill = await Bill.findByIdAndDelete(billId);
    return bill;
  } catch (error) {
    throw error;
  }
};

const updateBillStatus = async (billId, status) => {
  try {
    const bill = await Bill.findByIdAndUpdate(billId, { status }, { new: true });
    return bill;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  deleteBill,
  updateBillStatus,
};
