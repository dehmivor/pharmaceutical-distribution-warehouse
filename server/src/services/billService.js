const Bill = require('../models/Bill');

const getAllBills = async () => {
  try {
    const bills = await Bill.find()
      .populate({
        path: 'import_order_id',
        select: 'supplier_contract_id warehouse_manager_id status created_by approval_by details',
        populate: [
          {
            path: 'supplier_contract_id',
            select: 'contract_name', // hoặc các trường bạn muốn hiển thị
            model: 'SupplierContract',
          },
          {
            path: 'warehouse_manager_id',
            select: 'name email', // ví dụ trường name, email của user
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
module.exports = {
  getAllBills,
  getBillById,
  createBill,
};
