const mongoose = require('mongoose');
const PrincipalContract = require('../models/PrincipalContract');
const { CONTRACT_STATUSES, PARTNER_TYPES, ANNEX_STATUSES, ANNEX_ACTIONS, USER_ROLES } = require('../utils/constants');
const { getValidItemsAtDate } = require('../utils/contractUtils');

const principalContractService = {
  async getAllPrincipalContracts({
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
    const contracts = await PrincipalContract.find(query)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code')
      .sort({ contract_code: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PrincipalContract.countDocuments(query);

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

  async getPrincipalContractById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return PrincipalContract.findById(id)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code')
      .lean();
  },

  async createPrincipalContract(contractData) {
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
        .countDocuments({ _id: { $in: medicineIds }, status: 'active' });
      if (validCount !== medicineIds.length) {
        throw new Error('One or more medicine IDs are invalid or inactive');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newContract = await PrincipalContract.create([contractData], { session });

      const populated = await PrincipalContract.findById(newContract[0]._id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.items.medicine_id', 'medicine_name license_code')
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

  async updatePrincipalContract(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const contract = await PrincipalContract.findById(id);
    if (!contract) {
      return null;
    }

    const [partnerExists, medicinesValid] = await Promise.all([
      mongoose
        .model(updateData.partner_type === 'Supplier' ? 'Supplier' : 'Retailer')
        .exists({ _id: updateData.partner_id }),
      mongoose.model('Medicine').countDocuments({
        _id: { $in: updateData.items.map((i) => i.medicine_id), status: 'active' },
      }),
    ]);

    if (!partnerExists) {
      throw new Error('Invalid partner_id: Partner does not exist');
    }

    if (medicinesValid !== updateData.items.length) {
      throw new Error('One or more medicine IDs are invalid or inactive');
    }

    delete updateData.status;
    delete updateData.annexes;

    const updated = await PrincipalContract.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code');

    return updated;
  },

  async deletePrincipalContract(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return PrincipalContract.findByIdAndDelete(id);
  },

  async updateContractStatus(id, newStatus, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await PrincipalContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const currentStatus = contract.status;

    if ([CONTRACT_STATUSES.EXPIRED, CONTRACT_STATUSES.CANCELLED].includes(currentStatus)) {
      throw new Error(`Cannot update a contract with status "${currentStatus}"`);
    }

    switch (currentStatus) {
      case CONTRACT_STATUSES.DRAFT:
        if (![CONTRACT_STATUSES.ACTIVE, CONTRACT_STATUSES.CANCELLED].includes(newStatus)) {
          throw new Error(`Draft contracts can only be updated to "active" or "cancelled"`);
        }
        if (user.role !== USER_ROLES.SUPERVISOR) {
          throw new Error('Only supervisors can approve or cancel draft contracts');
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
    await contract.save();

    return await PrincipalContract.findById(contract._id)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code')
      .lean();
  },

  async createAnnex(id, annexData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await PrincipalContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== CONTRACT_STATUSES.ACTIVE) {
      throw new Error('Annexes can only be added to active contracts');
    }

    if (annexData.items && annexData.items.length > 0) {
      const medicineIds = annexData.items.map((item) => item.medicine_id);
      const validCount = await mongoose
        .model('Medicine')
        .countDocuments({ _id: { $in: medicineIds }, status: 'active' });
      if (validCount !== medicineIds.length) {
        throw new Error('One or more medicine IDs are invalid or inactive');
      }
    }

    if (!annexData.status) {
      annexData.status = ANNEX_STATUSES.DRAFT;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      contract.annexes.push(annexData);
      await contract.save({ session });

      const populated = await PrincipalContract.findById(id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.items.medicine_id', 'medicine_name license_code')
        .session(session);

      await session.commitTransaction();
      return populated;
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000 && error.keyPattern?.['annexes.annex_code']) {
        throw new Error('Annex code already exists in this contract');
      }
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateAnnex(id, annex_code, annexData, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await PrincipalContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.created_by.toString() !== user.userId) {
      throw new Error('Only the contract creator can update annexes');
    }

    const annex = contract.annexes.find((a) => a.annex_code === annex_code);
    if (!annex) {
      throw new Error('Annex not found');
    }

    if (annex.status !== ANNEX_STATUSES.DRAFT) {
      throw new Error('Only draft annexes can be updated');
    }

    if (annexData.items && annexData.items.length > 0) {
      const medicineIds = annexData.items.map((item) => item.medicine_id);
      const validCount = await mongoose
        .model('Medicine')
        .countDocuments({ _id: { $in: medicineIds }, status: 'active' });
      if (validCount !== medicineIds.length) {
        throw new Error('One or more medicine IDs are invalid or inactive');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const updated = await PrincipalContract.findOneAndUpdate(
        { _id: id, 'annexes.annex_code': annex_code },
        {
          $set: {
            'annexes.$.action': annexData.action,
            'annexes.$.items': annexData.items,
            'annexes.$.end_date': annexData.end_date,
            'annexes.$.description': annexData.description,
          },
        },
        { new: true, runValidators: true, session }
      )
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.items.medicine_id', 'medicine_name license_code');

      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateAnnexStatus(id, annex_code, newStatus, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await PrincipalContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const annex = contract.annexes.find((a) => a.annex_code === annex_code);
    if (!annex) {
      throw new Error('Annex not found');
    }

    const currentStatus = annex.status;

    if ([ANNEX_STATUSES.ACTIVE, ANNEX_STATUSES.REJECTED].includes(currentStatus)) {
      throw new Error(`Cannot update an annex with status "${currentStatus}"`);
    }

    if (currentStatus === ANNEX_STATUSES.DRAFT) {
      if (![ANNEX_STATUSES.ACTIVE, ANNEX_STATUSES.REJECTED].includes(newStatus)) {
        throw new Error(`Draft annexes can only be updated to "active" or "rejected"`);
      }
      if (user.role !== USER_ROLES.SUPERVISOR) {
        throw new Error('Only supervisors can approve or reject annexes');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const updated = await PrincipalContract.findOneAndUpdate(
        { _id: id, 'annexes.annex_code': annex_code },
        { $set: { 'annexes.$.status': newStatus } },
        { new: true, session }
      )
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.items.medicine_id', 'medicine_name license_code');

      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getValidItemsAtDate(id, targetDate) {
    const contract = await this.getPrincipalContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return getValidItemsAtDate(contract, targetDate);
  },
};

module.exports = principalContractService;