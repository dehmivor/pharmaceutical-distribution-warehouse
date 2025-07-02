const mongoose = require('mongoose');
const EconomicContract = require('../models/EconomicContract');
const { CONTRACT_STATUSES, PARTNER_TYPES, USER_ROLES } = require('../utils/constants');

const economicContractService = {
  async getAllEconomicContracts({
    page,
    limit,
    created_by,
    partner_id,
    partner_type,
    status,
    contract_code,
  }) {
    const query = {};

    if (created_by && mongoose.Types.ObjectId.isValid(created_by)) {
      query.created_by = created_by;
    }

    if (partner_id && mongoose.Types.ObjectId.isValid(partner_id)) {
      query.partner_id = partner_id;
    }

    if (partner_type && Object.values(PARTNER_TYPES).includes(partner_type)) {
      query.partner_type = partner_type;
    }

    if (status && Object.values(CONTRACT_STATUSES).includes(status)) {
      query.status = status;
    }

    if (contract_code) {
      query.contract_code = { $regex: contract_code, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const contracts = await EconomicContract.find(query)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name') // dynamic ref to Supplier or Retailer
      .populate('items.medicine_id', 'medicine_name license_code')
      .sort({ contract_code: 1 }) // sort by contract_code or any other field as needed
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EconomicContract.countDocuments(query);

    return {
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getEconomicContractById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return EconomicContract.findById(id)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name') // dynamic ref to Supplier or Retailer
      .populate('items.medicine_id', 'medicine_name license_code')
      .lean();
  },

  async createEconomicContract(contractData) {
    if (!contractData.status) {
      contractData.status = CONTRACT_STATUSES.DRAFT;
    }

    const [userExists, partnerExists] = await Promise.all([
      mongoose.model('User').exists({ _id: contractData.created_by }),
      mongoose.model(contractData.partner_type === 'Supplier' ? 'Supplier' : 'Retailer').exists({
        _id: contractData.partner_id,
      }),
    ]);

    if (!userExists) {
      throw new Error('Invalid created_by: User does not exist');
    }

    if (!partnerExists) {
      throw new Error('Invalid partner_id: Partner does not exist');
    }

    if (contractData.items && contractData.items.length > 0) {
      const medicineIds = contractData.items.map((item) => item.medicine_id);
      const validCount = await mongoose
        .model('Medicine')
        .countDocuments({ _id: { $in: medicineIds } });
      if (validCount !== medicineIds.length) {
        throw new Error('One or more medicine IDs are invalid');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newContract = await EconomicContract.create([contractData], { session });

      const populated = await EconomicContract.findById(newContract[0]._id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'license_code medicine_name')
        .session(session);

      await session.commitTransaction();
      return populated;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000 && error.keyPattern?.contract_code) {
        throw new Error('Contract code already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateEconomicContract(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const contract = await EconomicContract.findById(id);
    if (!contract) {
      return null;
    }

    const [partnerExists, medicinesValid] = await Promise.all([
      mongoose
        .model(updateData.partner_type === 'Supplier' ? 'Supplier' : 'Retailer')
        .exists({ _id: updateData.partner_id }),
      mongoose.model('Medicine').countDocuments({
        _id: { $in: updateData.items.map((i) => i.medicine_id) },
      }),
    ]);

    if (!partnerExists) {
      throw new Error('Invalid partner_id: Partner does not exist');
    }

    if (medicinesValid !== updateData.items.length) {
      throw new Error('One or more medicine IDs are invalid');
    }

    delete updateData.status;

    const updated = await EconomicContract.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'license_code medicine_name');

    return updated;
  },

  async deleteEconomicContract(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return EconomicContract.findByIdAndDelete(id);
  },

  async updateContractStatus(id, newStatus, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await EconomicContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const currentStatus = contract.status;

    // Danh sách các trạng thái không được cập nhật nữa
    if ([CONTRACT_STATUSES.EXPIRED, CONTRACT_STATUSES.CANCELLED].includes(currentStatus)) {
      throw new Error(`Cannot update a contract with status "${currentStatus}"`);
    }

    // Logic chuyển trạng thái hợp lệ + phân quyền
    switch (currentStatus) {
      case CONTRACT_STATUSES.DRAFT:
        if (![CONTRACT_STATUSES.ACTIVE, CONTRACT_STATUSES.REJECTED].includes(newStatus)) {
          throw new Error(`Draft contracts can only be updated to "active" or "rejected"`);
        }
        if (user.role !== USER_ROLES.SUPERVISOR) {
          throw new Error('Only supervisors can approve or reject draft contracts');
        }
        break;

      case CONTRACT_STATUSES.REJECTED:
        if (newStatus !== CONTRACT_STATUSES.DRAFT) {
          throw new Error('Rejected contracts can only be updated back to draft');
        }
        if (contract.created_by.toString() !== user.userId) {
          throw new Error('Only the contract creator can resubmit a rejected contract');
        }
        break;

      case CONTRACT_STATUSES.ACTIVE:
        if (![CONTRACT_STATUSES.CANCELLED].includes(newStatus)) {
          throw new Error('Active contracts can only be marked as cancelled');
        }
        if (user.role !== USER_ROLES.SUPERVISOR) {
          throw new Error('Only supervisors can cancel active contracts');
        }
        break;

      default:
        throw new Error(`Unsupported status transition from "${currentStatus}"`);
    }

    contract.status = newStatus;
    console.log(`Updating contract ${id} status from ${currentStatus} to ${newStatus}`);
    await contract.save();

    return await EconomicContract.findById(contract._id)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'license_code medicine_name')
      .lean();
  },
};

module.exports = economicContractService;
