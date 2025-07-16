const mongoose = require('mongoose');
const Contract = require('../models/Contract');
const { CONTRACT_STATUSES, PARTNER_TYPES, ANNEX_STATUSES, ANNEX_ACTIONS, CONTRACT_TYPES, USER_ROLES } = require('../utils/constants');

const contractService = {
  async getAllContracts({
    page,
    limit,
    created_by,
    partner_id,
    partner_type,
    contract_type,
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

    if (contract_type && Object.values(CONTRACT_TYPES).includes(contract_type)) {
      query.contract_type = contract_type;
    }

    if (status && Object.values(CONTRACT_STATUSES).includes(status)) {
      query.status = status;
    }

    if (contract_code) {
      query.contract_code = { $regex: contract_code, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const contracts = await Contract.find(query)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code')
      .sort({ contract_code: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Contract.countDocuments(query);

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

  async getContractById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Contract.findById(id)
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code')
      .lean();
  },

  async createContract(contractData) {
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

    if (contractData.contract_type === CONTRACT_TYPES.ECONOMIC && contractData.annexes && contractData.annexes.length > 0) {
      throw new Error('Annexes are not allowed for economic contracts');
    }

    if (contractData.contract_type === CONTRACT_TYPES.PRINCIPAL && contractData.annexes && contractData.annexes.length > 0) {
    for (const annex of contractData.annexes) {
      if (!annex.annex_code) {
        throw new Error('Annex code is required');
      }
      if (!Object.values(ANNEX_ACTIONS).includes(annex.action)) {
        throw new Error(`Action must be one of: ${Object.values(ANNEX_ACTIONS).join(', ')}`);
      }
      if ([ANNEX_ACTIONS.ADD, ANNEX_ACTIONS.REMOVE, ANNEX_ACTIONS.UPDATE_PRICE].includes(annex.action)) {
        if (!annex.items || annex.items.length === 0) {
          throw new Error('Items must be a non-empty array for add, remove, or update_price actions');
        }
        const medicineIds = annex.items.map((item) => item.medicine_id);
        const validCount = await mongoose
          .model('Medicine')
          .countDocuments({ _id: { $in: medicineIds }, status: 'active' });
        if (validCount !== medicineIds.length) {
          throw new Error('One or more medicine IDs in annexes are invalid or inactive');
        }
        if ([ANNEX_ACTIONS.ADD, ANNEX_ACTIONS.UPDATE_PRICE].includes(annex.action)) {
          for (const item of annex.items) {
            if (item.unit_price === undefined || item.unit_price < 0) {
              throw new Error('Unit price is required and must be non-negative for add or update_price actions');
            }
          }
        }
      }
      if (annex.action === ANNEX_ACTIONS.UPDATE_END_DATE) {
        if (!annex.end_date || new Date(annex.end_date) < new Date(contractData.start_date)) {
          throw new Error('End date is required and must be after contract start date for update_end_date action');
        }
      }
      if (annex.status && !Object.values(ANNEX_STATUSES).includes(annex.status)) {
        throw new Error(`Annex status must be one of: ${Object.values(ANNEX_STATUSES).join(', ')}`);
      }
    }
  }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newContract = await Contract.create([contractData], { session });

      const populated = await Contract.findById(newContract[0]._id)
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

  async updateContract(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const contract = await Contract.findById(id);
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

    if (updateData.contract_type === CONTRACT_TYPES.ECONOMIC && updateData.annexes && updateData.annexes.length > 0) {
      throw new Error('Annexes are not allowed for economic contracts');
    }

    delete updateData.status;
    delete updateData.annexes;

    const updated = await Contract.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('created_by', 'name email')
      .populate('partner_id', 'name')
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.items.medicine_id', 'medicine_name license_code');

    return updated;
  },

  async deleteContract(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Contract.findByIdAndDelete(id);
  },

  async updateContractStatus(id, newStatus, user) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await Contract.findById(id);
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

    return await Contract.findById(contract._id)
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

    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.contract_type !== CONTRACT_TYPES.PRINCIPAL) {
      throw new Error('Annexes are only allowed for principal contracts');
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

      const populated = await Contract.findById(id)
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

    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.contract_type !== CONTRACT_TYPES.PRINCIPAL) {
      throw new Error('Annexes are only allowed for principal contracts');
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
      const updated = await Contract.findOneAndUpdate(
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

    const contract = await Contract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.contract_type !== CONTRACT_TYPES.PRINCIPAL) {
      throw new Error('Annexes are only allowed for principal contracts');
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
      const updated = await Contract.findOneAndUpdate(
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
    const contract = await this.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.contract_type === CONTRACT_TYPES.ECONOMIC) {
      if (contract.end_date < targetDate) {
        return [];
      }
      return contract.items;
    }

    let validItems = [...contract.items];

    const applicableAnnexes = contract.annexes
      .filter(annex => annex.status === ANNEX_STATUSES.ACTIVE && new Date(annex.created_at) <= targetDate)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const annex of applicableAnnexes) {
      if (annex.action === ANNEX_ACTIONS.ADD) {
        validItems.push(...annex.items);
      } else if (annex.action === ANNEX_ACTIONS.REMOVE) {
        validItems = validItems.filter(
          item => !annex.items.some(annexItem => annexItem.medicine_id.equals(item.medicine_id))
        );
      } else if (annex.action === ANNEX_ACTIONS.UPDATE_PRICE) {
        for (const annexItem of annex.items) {
          const index = validItems.findIndex(item => item.medicine_id.equals(annexItem.medicine_id));
          if (index !== -1) {
            validItems[index].unit_price = annexItem.unit_price;
          }
        }
      } else if (annex.action === ANNEX_ACTIONS.UPDATE_END_DATE) {
        contract.end_date = annex.end_date;
      }
    }

    if (contract.end_date < targetDate) {
      return [];
    }

    return validItems;
  },
};

module.exports = contractService;