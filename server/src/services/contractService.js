const mongoose = require('mongoose');
const Contract = require('../models/Contract');
const medicineService = require('./medicineService');
const { CONTRACT_STATUSES, PARTNER_TYPES, ANNEX_STATUSES, ANNEX_ACTIONS, CONTRACT_TYPES, USER_ROLES } = require('../utils/constants');

const contractService = {
  // Helper function để kiểm tra annex có thay đổi gì không

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
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code')
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
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code')
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
        
        // Validate medicine changes
        if (annex.medicine_changes) {
          const { add_items, remove_items, update_prices } = annex.medicine_changes;
          
          // Validate add items
          if (add_items && add_items.length > 0) {
            const addMedicineIds = add_items.map(item => item.medicine_id);
            const validAddCount = await mongoose
              .model('Medicine')
              .countDocuments({ _id: { $in: addMedicineIds }, status: 'active' });
            if (validAddCount !== addMedicineIds.length) {
              throw new Error('One or more medicine IDs in add_items are invalid or inactive');
            }
            
            // Check for duplicate medicine IDs in add_items
            const uniqueAddIds = new Set(addMedicineIds);
            if (uniqueAddIds.size !== addMedicineIds.length) {
              throw new Error('Duplicate medicine IDs found in add_items');
            }
          }
          
          // Validate remove items
          if (remove_items && remove_items.length > 0) {
            const removeMedicineIds = remove_items.map(item => item.medicine_id);
            const validRemoveCount = await mongoose
              .model('Medicine')
              .countDocuments({ _id: { $in: removeMedicineIds }, status: 'active' });
            if (validRemoveCount !== removeMedicineIds.length) {
              throw new Error('One or more medicine IDs in remove_items are invalid or inactive');
            }
            
            // Check for duplicate medicine IDs in remove_items
            const uniqueRemoveIds = new Set(removeMedicineIds);
            if (uniqueRemoveIds.size !== removeMedicineIds.length) {
              throw new Error('Duplicate medicine IDs found in remove_items');
            }
          }
          
          // Validate update prices
          if (update_prices && update_prices.length > 0) {
            const updateMedicineIds = update_prices.map(item => item.medicine_id);
            const validUpdateCount = await mongoose
              .model('Medicine')
              .countDocuments({ _id: { $in: updateMedicineIds }, status: 'active' });
            if (validUpdateCount !== updateMedicineIds.length) {
              throw new Error('One or more medicine IDs in update_prices are invalid or inactive');
            }
            
            // Check for duplicate medicine IDs in update_prices
            const uniqueUpdateIds = new Set(updateMedicineIds);
            if (uniqueUpdateIds.size !== updateMedicineIds.length) {
              throw new Error('Duplicate medicine IDs found in update_prices');
            }
          }
        }
        
        // Validate end date change
        if (annex.end_date_change && annex.end_date_change.new_end_date) {
          if (new Date(annex.end_date_change.new_end_date) < new Date(contractData.start_date)) {
            throw new Error('New end date must be after contract start date');
          }
        }
        
        if (annex.status && !Object.values(ANNEX_STATUSES).includes(annex.status)) {
          throw new Error(`Annex status must be one of: ${Object.values(ANNEX_STATUSES).join(', ')}`);
        }
      }
      
      // Validate toàn bộ contract với annexes
      const validation = await this.validateExistingContractWithAnnexes(contractData);
      if (!validation.isValid) {
        throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
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
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code')
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

    // Debug: Kiểm tra contract hiện tại

    const [partnerExists, medicinesValid] = await Promise.all([
      mongoose
        .model(updateData.partner_type === 'Supplier' ? 'Supplier' : 'Retailer')
        .exists({ _id: updateData.partner_id }),
      mongoose.model('Medicine').countDocuments({
        _id: { $in: updateData.items.map((i) => i.medicine_id) },
        status: 'active'
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

    // Không cho phép update status qua API này, phải dùng API riêng
    if (updateData.hasOwnProperty('status')) {
      delete updateData.status;
    }
    
    // Nếu có annexes, validate và update
    if (updateData.annexes) {
      if (updateData.contract_type === CONTRACT_TYPES.PRINCIPAL) {
        // Validate annexes cho principal contracts
        for (const annex of updateData.annexes) {
          if (!annex.annex_code) {
            throw new Error('Annex code is required');
          }
          
          // Validate medicine changes
          if (annex.medicine_changes) {
            const { add_items, remove_items, update_prices } = annex.medicine_changes;
            
            // Validate add items
            if (add_items && add_items.length > 0) {
              const addMedicineIds = add_items.map(item => item.medicine_id);
              const validAddCount = await mongoose
                .model('Medicine')
                .countDocuments({ _id: { $in: addMedicineIds }, status: 'active' });
              if (validAddCount !== addMedicineIds.length) {
                throw new Error('One or more medicine IDs in add_items are invalid or inactive');
              }
            }
            
            // Validate remove items
            if (remove_items && remove_items.length > 0) {
              const removeMedicineIds = remove_items.map(item => item.medicine_id);
              const validRemoveCount = await mongoose
                .model('Medicine')
                .countDocuments({ _id: { $in: removeMedicineIds }, status: 'active' });
              if (validRemoveCount !== removeMedicineIds.length) {
                throw new Error('One or more medicine IDs in remove_items are invalid or inactive');
              }
            }
            
            // Validate update prices
            if (update_prices && update_prices.length > 0) {
              const updateMedicineIds = update_prices.map(item => item.medicine_id);
              const validUpdateCount = await mongoose
                .model('Medicine')
                .countDocuments({ _id: { $in: updateMedicineIds }, status: 'active' });
              if (validUpdateCount !== updateMedicineIds.length) {
                throw new Error('One or more medicine IDs in update_prices are invalid or inactive');
              }
            }
          }
        }
        
        // Validate toàn bộ contract với annexes (giống như create)
        const validation = await this.validateExistingContractWithAnnexes(updateData);
        if (!validation.isValid) {
          throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
        }
      }
    }
    
    // Update contract using $set to avoid touching status field
    const updateFields = {
      contract_code: updateData.contract_code,
      contract_type: updateData.contract_type,
      partner_type: updateData.partner_type,
      partner_id: updateData.partner_id,
      start_date: updateData.start_date,
      end_date: updateData.end_date,
      items: updateData.items,
      annexes: updateData.annexes
    };

    // Validate end_date manually
    if (new Date(updateData.end_date) < new Date(updateData.start_date)) {
      throw new Error('End date must be after start date');
    }

    // Check if contract_code is unique (excluding current contract)
    if (updateData.contract_code) {
      const existingContract = await Contract.findOne({ 
        contract_code: updateData.contract_code, 
        _id: { $ne: id } 
      });
      if (existingContract) {
        throw new Error('Contract code already exists');
      }
    }

    try {
      // Sử dụng updateOne để tránh validation issues
      const result = await Contract.updateOne(
        { _id: id },
        { $set: updateFields }
      );
      
      if (result.modifiedCount === 0) {
        throw new Error('No contract was updated');
      }
      
      // Fetch updated contract
      const updated = await Contract.findById(id);
      if (!updated) {
        throw new Error('Failed to fetch updated contract');
      }
      
      // Populate the saved contract
      const populated = await Contract.findById(id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');

      return populated;
    } catch (error) {
      console.log('Update error:', error.message);
      console.log('Error details:', error);
      throw error;
    }
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

    if (contract.status === newStatus) {
      throw new Error(`Contract is already ${newStatus}`);
    }

    // Kiểm tra quyền
    if (newStatus === CONTRACT_STATUSES.ACTIVE && user.role !== USER_ROLES.REPRESENTATIVEMANAGER) {
      throw new Error('Only representative managers can approve contracts');
    }

    if (newStatus === CONTRACT_STATUSES.CANCELLED && user.role !== USER_ROLES.REPRESENTATIVEMANAGER) {
      throw new Error('Only representative manager can cancel contracts');
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Update contract status
      contract.status = newStatus;

      // Nếu duyệt principal contract có annexes, tự động active tất cả annexes
      if (newStatus === CONTRACT_STATUSES.ACTIVE && 
          contract.contract_type === CONTRACT_TYPES.PRINCIPAL && 
          contract.annexes && 
          contract.annexes.length > 0) {
        
        // Validate contract and annexes trước khi duyệt
        const validation = await this.validateExistingContractWithAnnexes(contract);
        if (!validation.isValid) {
          throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
        }

        // Active tất cả annexes
        for (const annex of contract.annexes) {
          annex.status = ANNEX_STATUSES.ACTIVE;
        }
      }

      await contract.save({ session });

      const populated = await Contract.findById(id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code')
        .session(session);

      await session.commitTransaction();
      return populated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

    // Chỉ cho phép tạo annex khi contract active hoặc expired
    if (![CONTRACT_STATUSES.ACTIVE, CONTRACT_STATUSES.EXPIRED].includes(contract.status)) {
      throw new Error('Annexes can only be added to active or expired contracts');
    }

    // Kiểm tra tất cả annex hiện tại phải active
    if (contract.annexes && contract.annexes.length > 0) {
      const inactiveAnnexes = contract.annexes.filter(annex => annex.status !== ANNEX_STATUSES.ACTIVE);
      if (inactiveAnnexes.length > 0) {
        const inactiveCodes = inactiveAnnexes.map(a => a.annex_code).join(', ');
        throw new Error(`Cannot create new annex. The following annexes are not active: ${inactiveCodes}`);
      }
    }

    // Validate new annex against current contract state
    const validation = await this.validateNewAnnex(id, annexData);
    if (!validation.isValid) {
      throw new Error(`Invalid annex: ${validation.errors.join(', ')}`);
    }

    // UC3: Validate ngày ký phụ lục
    const dateValidation = await this.validateAnnexSignedDate(id, annexData);
    if (!dateValidation.isValid) {
      throw new Error(`Invalid signed date: ${dateValidation.errors.join(', ')}`);
    }

    // Kiểm tra annex có tác động gì không
    const hasChanges = (
      (annexData.medicine_changes?.add_items && annexData.medicine_changes.add_items.length > 0) ||
      (annexData.medicine_changes?.remove_items && annexData.medicine_changes.remove_items.length > 0) ||
      (annexData.medicine_changes?.update_prices && annexData.medicine_changes.update_prices.length > 0) ||
      (annexData.end_date_change && annexData.end_date_change.new_end_date)
    );
    
    if (!hasChanges) {
      throw new Error(`Phụ lục không có thay đổi nào. Phụ lục phải có ít nhất một thay đổi về thuốc hoặc thời hạn.`);
    }

    // Validate medicine changes
    if (annexData.medicine_changes) {
      const { add_items, remove_items, update_prices } = annexData.medicine_changes;
      
      // Collect all medicine IDs for validation
      const allMedicineIds = [];
      if (add_items) allMedicineIds.push(...add_items.map(item => item.medicine_id));
      if (remove_items) allMedicineIds.push(...remove_items.map(item => item.medicine_id));
      if (update_prices) allMedicineIds.push(...update_prices.map(item => item.medicine_id));
      
      if (allMedicineIds.length > 0) {
        const validCount = await mongoose
          .model('Medicine')
          .countDocuments({ _id: { $in: allMedicineIds }, status: 'active' });
        if (validCount !== allMedicineIds.length) {
          throw new Error('One or more medicine IDs are invalid or inactive');
        }
      }
    }

    // Annex mới luôn có status DRAFT
    annexData.status = ANNEX_STATUSES.DRAFT;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      contract.annexes.push(annexData);
      await contract.save({ session });

      const populated = await Contract.findById(id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code')
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

    if (annex.status !== ANNEX_STATUSES.DRAFT && annex.status !== ANNEX_STATUSES.REJECTED) {
      throw new Error('Only draft or rejected annexes can be updated');
    }

    // Kiểm tra annex có tác động gì không
    const hasChanges = (
      (annexData.medicine_changes?.add_items && annexData.medicine_changes.add_items.length > 0) ||
      (annexData.medicine_changes?.remove_items && annexData.medicine_changes.remove_items.length > 0) ||
      (annexData.medicine_changes?.update_prices && annexData.medicine_changes.update_prices.length > 0) ||
      (annexData.end_date_change && annexData.end_date_change.new_end_date)
    );
    
    if (!hasChanges) {
      throw new Error(`Phụ lục ${annex_code} không có thay đổi nào. Phụ lục phải có ít nhất một thay đổi về thuốc hoặc thời hạn.`);
    }

    // Validate medicine changes
    if (annexData.medicine_changes) {
      const { add_items, remove_items, update_prices } = annexData.medicine_changes;
      
      // Collect all medicine IDs for validation
      const allMedicineIds = [];
      if (add_items) allMedicineIds.push(...add_items.map(item => item.medicine_id));
      if (remove_items) allMedicineIds.push(...remove_items.map(item => item.medicine_id));
      if (update_prices) allMedicineIds.push(...update_prices.map(item => item.medicine_id));
      
      if (allMedicineIds.length > 0) {
        const validCount = await mongoose
          .model('Medicine')
          .countDocuments({ _id: { $in: allMedicineIds }, status: 'active' });
        if (validCount !== allMedicineIds.length) {
          throw new Error('One or more medicine IDs are invalid or inactive');
        }
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      // Prepare update data
      const updateData = {
        'annexes.$.medicine_changes': annexData.medicine_changes,
        'annexes.$.end_date_change': annexData.end_date_change,
        'annexes.$.description': annexData.description,
      };
      
      // If annex status is 'rejected', automatically change it to 'draft' for resubmission
      if (annex.status === ANNEX_STATUSES.REJECTED) {
        updateData['annexes.$.status'] = ANNEX_STATUSES.DRAFT;
      }
      
      const updated = await Contract.findOneAndUpdate(
        { _id: id, 'annexes.annex_code': annex_code },
        { $set: updateData },
        { new: true, runValidators: false, session }
      );

      await session.commitTransaction();
      
      // Populate after transaction commit to avoid issues
      const populated = await Contract.findById(id)
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');
      
      return populated;
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

    // Kiểm tra xem contract có phải là contract mới với annex không
    // Nếu contract được tạo với annex (tất cả annex đều có cùng signed_date gần với contract start_date)
    const contractStartDate = new Date(contract.start_date);
    const annexSignedDate = new Date(annex.signed_date);
    const timeDiff = Math.abs(annexSignedDate - contractStartDate);
    const isContractWithAnnexes = timeDiff <= 7 * 24 * 60 * 60 * 1000; // 7 ngày

    if (isContractWithAnnexes) {
      throw new Error('Cannot update annex status individually for contracts created with annexes. Use approveContractWithAnnexes instead.');
    }

    const currentStatus = annex.status;

    if ([ANNEX_STATUSES.ACTIVE, ANNEX_STATUSES.REJECTED].includes(currentStatus)) {
      throw new Error(`Cannot update an annex with status "${currentStatus}"`);
    }

    if (currentStatus === ANNEX_STATUSES.DRAFT) {
      if (![ANNEX_STATUSES.ACTIVE, ANNEX_STATUSES.REJECTED].includes(newStatus)) {
        throw new Error(`Draft annexes can only be updated to "active" or "rejected"`);
      }
      if (user.role !== USER_ROLES.REPRESENTATIVEMANAGER) {
        throw new Error('Only representative managers can approve or reject annexes');
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const updated = await Contract.findOneAndUpdate(
        { _id: id, 'annexes.annex_code': annex_code },
        { $set: { 'annexes.$.status': newStatus } },
        { new: true, runValidators: true, session }
      )
        .populate('created_by', 'name email')
        .populate('partner_id', 'name')
        .populate('items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
        .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');

      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Tính toán trạng thái hiện tại của hợp đồng dựa trên hợp đồng gốc và các phụ lục đã được phê duyệt
  async getCurrentContractState(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await Contract.findById(id)
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.contract_type !== CONTRACT_TYPES.PRINCIPAL) {
      throw new Error('This method is only applicable to principal contracts');
    }

    // Lấy tất cả phụ lục đã được phê duyệt, sắp xếp theo thời gian tạo
    const activeAnnexes = contract.annexes
      .filter(annex => annex.status === ANNEX_STATUSES.ACTIVE)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Bắt đầu với danh sách thuốc từ hợp đồng gốc
    let currentItems = [...contract.items];
    let currentEndDate = contract.end_date;

    // Áp dụng các thay đổi từ phụ lục theo thứ tự thời gian
    activeAnnexes.forEach(annex => {
      // Xử lý thay đổi thuốc
      if (annex.medicine_changes) {
        const { add_items, remove_items, update_prices } = annex.medicine_changes;

        // Thêm thuốc mới
        if (add_items && add_items.length > 0) {
          add_items.forEach(addItem => {
            // Kiểm tra xem thuốc đã tồn tại chưa
            const existingItem = currentItems.find(
              item => item.medicine_id.toString() === addItem.medicine_id.toString()
            );
            if (!existingItem) {
              currentItems.push({
                medicine_id: addItem.medicine_id,
                unit_price: addItem.unit_price
              });
            }
          });
        }

        // Xóa thuốc
        if (remove_items && remove_items.length > 0) {
          const removeIds = remove_items.map(item => item.medicine_id.toString());
          currentItems = currentItems.filter(
            item => !removeIds.includes(item.medicine_id.toString())
          );
        }

        // Cập nhật giá
        if (update_prices && update_prices.length > 0) {
          update_prices.forEach(updateItem => {
            const existingItem = currentItems.find(
              item => item.medicine_id.toString() === updateItem.medicine_id.toString()
            );
            if (existingItem) {
              existingItem.unit_price = updateItem.unit_price;
            }
          });
        }
      }

      // Xử lý thay đổi thời hạn
      if (annex.end_date_change && annex.end_date_change.new_end_date) {
        currentEndDate = annex.end_date_change.new_end_date;
      }
    });

    return {
      contract_id: contract._id,
      contract_code: contract.contract_code,
      current_items: currentItems,
      current_end_date: currentEndDate,
      original_items: contract.items,
      original_end_date: contract.end_date,
      applied_annexes: activeAnnexes.map(annex => ({
        annex_code: annex.annex_code,
        created_at: annex.created_at,
        description: annex.description
      }))
    };
  },

  // Kiểm tra tính hợp lệ của phụ lục mới dựa trên trạng thái hiện tại
  async validateNewAnnex(contractId, annexData) {
    const currentState = await this.getCurrentContractState(contractId);
    const currentMedicineIds = currentState.current_items.map(item => 
      typeof item.medicine_id === 'object' ? item.medicine_id._id.toString() : item.medicine_id.toString()
    );



    const errors = [];

    // Kiểm tra thêm thuốc mới
    if (annexData.medicine_changes && annexData.medicine_changes.add_items) {
      for (const item of annexData.medicine_changes.add_items) {
        
        if (currentMedicineIds.includes(item.medicine_id.toString())) {
          const medicine = await medicineService.findMedicineById(item.medicine_id);
          const medicineInfo = medicine ? medicine.license_code : item.medicine_id;
          errors.push(`Thuốc ${medicineInfo} đã tồn tại trong hợp đồng hiện tại`);
        }
      }
    }

    // Kiểm tra xóa thuốc
    if (annexData.medicine_changes && annexData.medicine_changes.remove_items) {
      for (const item of annexData.medicine_changes.remove_items) {
        if (!currentMedicineIds.includes(item.medicine_id.toString())) {
          const medicine = await medicineService.findMedicineById(item.medicine_id);
          const medicineInfo = medicine ? medicine.license_code : item.medicine_id;
          errors.push(`Thuốc ${medicineInfo} không tồn tại trong hợp đồng hiện tại`);
        }
      }
    }

    // Kiểm tra cập nhật giá
    if (annexData.medicine_changes && annexData.medicine_changes.update_prices) {
      for (const item of annexData.medicine_changes.update_prices) {
        if (!currentMedicineIds.includes(item.medicine_id.toString())) {
          const medicine = await medicineService.findMedicineById(item.medicine_id);
          const medicineInfo = medicine ? medicine.license_code : item.medicine_id;
          errors.push(`Thuốc ${medicineInfo} không tồn tại trong hợp đồng hiện tại`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // UC1: Validate hợp đồng có sẵn với phụ lục
  async validateExistingContractWithAnnexes(contractData) {
    const errors = [];
    
    if (contractData.annexes && contractData.annexes.length > 0) {
      // Sắp xếp phụ lục theo ngày ký
      const sortedAnnexes = [...contractData.annexes].sort((a, b) => 
        new Date(a.signed_date) - new Date(b.signed_date)
      );

      let currentItems = [...contractData.items];
      
      for (let i = 0; i < sortedAnnexes.length; i++) {
        const annex = sortedAnnexes[i];
        const currentMedicineIds = new Set(currentItems.map(item => item.medicine_id.toString()));
        
        // Kiểm tra annex có tác động gì không
        const hasChanges = (
          (annex.medicine_changes?.add_items && annex.medicine_changes.add_items.length > 0) ||
          (annex.medicine_changes?.remove_items && annex.medicine_changes.remove_items.length > 0) ||
          (annex.medicine_changes?.update_prices && annex.medicine_changes.update_prices.length > 0) ||
          (annex.end_date_change && annex.end_date_change.new_end_date)
        );
        
        if (!hasChanges) {
          errors.push(`Phụ lục ${annex.annex_code} không có thay đổi nào. Phụ lục phải có ít nhất một thay đổi về thuốc hoặc thời hạn.`);
        }
        
        // Validate medicine changes
        if (annex.medicine_changes) {
          const { add_items, remove_items, update_prices } = annex.medicine_changes;
          
          // Check add items
          if (add_items && add_items.length > 0) {
            for (const item of add_items) {
              if (currentMedicineIds.has(item.medicine_id.toString())) {
                const medicine = await medicineService.findMedicineById(item.medicine_id);
                const medicineInfo = medicine ? `(${medicine.license_code})` : item.medicine_id;
                errors.push(`Phụ lục ${annex.annex_code}: Thuốc ${medicineInfo} đã tồn tại`);
              }
            }
          }
          
          // Check remove items
          if (remove_items && remove_items.length > 0) {
            for (const item of remove_items) {
              if (!currentMedicineIds.has(item.medicine_id.toString())) {
                const medicine = await medicineService.findMedicineById(item.medicine_id);
                const medicineInfo = medicine ? medicine.license_code : item.medicine_id;
                errors.push(`Phụ lục ${annex.annex_code}: Thuốc ${medicineInfo} không tồn tại`);
              }
            }
          }
          
          // Check update prices
          if (update_prices && update_prices.length > 0) {
            for (const item of update_prices) {
              if (!currentMedicineIds.has(item.medicine_id.toString())) {
                const medicine = await medicineService.findMedicineById(item.medicine_id);
                const medicineInfo = medicine ? medicine.license_code : item.medicine_id;
                errors.push(`Phụ lục ${annex.annex_code}: Thuốc ${medicineInfo} không tồn tại`);
              }
            }
          }
        }
        
        // Apply changes to current state for next validation
        if (annex.medicine_changes.add_items && annex.medicine_changes.add_items.length > 0) {
          annex.medicine_changes.add_items.forEach(addItem => {
            currentItems.push({
              medicine_id: addItem.medicine_id,
              unit_price: addItem.unit_price
            });
          });
        }
        
        if (annex.medicine_changes.remove_items && annex.medicine_changes.remove_items.length > 0) {
          const removeIds = annex.medicine_changes.remove_items.map(item => item.medicine_id.toString());
          currentItems = currentItems.filter(
            item => !removeIds.includes(item.medicine_id.toString())
          );
        }
        
        if (annex.medicine_changes.update_prices && annex.medicine_changes.update_prices.length > 0) {
          annex.medicine_changes.update_prices.forEach(updateItem => {
            const existingItem = currentItems.find(
              item => item.medicine_id.toString() === updateItem.medicine_id.toString()
            );
            if (existingItem) {
              existingItem.unit_price = updateItem.unit_price;
            }
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // UC3: Validate ngày ký phụ lục mới
  async validateAnnexSignedDate(contractId, annexData) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const errors = [];
    
    if (!annexData.signed_date) {
      errors.push('Ngày ký phụ lục là bắt buộc');
      return { isValid: false, errors };
    }

    const newSignedDate = new Date(annexData.signed_date);
    const contractStartDate = new Date(contract.start_date);

    // Ngày ký phải sau ngày bắt đầu hợp đồng
    if (newSignedDate < contractStartDate) {
      errors.push('Ngày ký phụ lục phải sau ngày bắt đầu hợp đồng');
    }

    // Kiểm tra với phụ lục cuối cùng
    if (contract.annexes && contract.annexes.length > 0) {
      const sortedAnnexes = [...contract.annexes].sort((a, b) => 
        new Date(b.signed_date) - new Date(a.signed_date)
      );
      const lastAnnex = sortedAnnexes[0];
      const lastSignedDate = new Date(lastAnnex.signed_date);

      if (newSignedDate <= lastSignedDate) {
        errors.push(`Ngày ký phụ lục phải sau ngày ký phụ lục cuối cùng (${lastAnnex.annex_code})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Helper function để kiểm tra có thể chỉnh sửa phụ lục không
  async canEditAnnex(contractId, annex_code) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const targetAnnex = contract.annexes.find(a => a.annex_code === annex_code);
    if (!targetAnnex) {
      throw new Error('Annex not found');
    }

    const sortedAnnexes = [...contract.annexes].sort((a, b) => 
      new Date(b.signed_date) - new Date(a.signed_date)
    );
    const lastAnnex = sortedAnnexes[0];

    return {
      canEdit: targetAnnex.annex_code === lastAnnex.annex_code,
      message: targetAnnex.annex_code === lastAnnex.annex_code 
        ? 'Có thể chỉnh sửa phụ lục cuối cùng'
        : 'Chỉ có thể chỉnh sửa phụ lục cuối cùng'
    };
  },

  // UC6: Lấy lịch sử thay đổi hợp đồng
  async getContractHistory(id) {
    const contract = await Contract.findById(id)
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');

    if (!contract) {
      throw new Error('Contract not found');
    }

    const history = [];
    
    // Thêm hợp đồng gốc
    history.push({
      date: contract.start_date,
      type: 'contract_created',
      description: 'Hợp đồng gốc được tạo',
      items: contract.items,
      end_date: contract.end_date
    });

    // Thêm các phụ lục theo thứ tự thời gian
    if (contract.annexes && contract.annexes.length > 0) {
      const sortedAnnexes = [...contract.annexes].sort((a, b) => 
        new Date(a.signed_date) - new Date(b.signed_date)
      );

      for (const annex of sortedAnnexes) {
        const changes = [];
        
        if (annex.medicine_changes) {
          if (annex.medicine_changes.add_items && annex.medicine_changes.add_items.length > 0) {
            changes.push(`Thêm ${annex.medicine_changes.add_items.length} thuốc`);
          }
          if (annex.medicine_changes.remove_items && annex.medicine_changes.remove_items.length > 0) {
            changes.push(`Xóa ${annex.medicine_changes.remove_items.length} thuốc`);
          }
          if (annex.medicine_changes.update_prices && annex.medicine_changes.update_prices.length > 0) {
            changes.push(`Cập nhật giá ${annex.medicine_changes.update_prices.length} thuốc`);
          }
        }
        
        if (annex.end_date_change && annex.end_date_change.new_end_date) {
          changes.push('Thay đổi ngày kết thúc hợp đồng');
        }

        history.push({
          date: annex.signed_date,
          type: 'annex_signed',
          description: `Phụ lục ${annex.annex_code}: ${changes.join(', ')}`,
          annex_code: annex.annex_code,
          changes: annex.medicine_changes,
          end_date_change: annex.end_date_change,
          status: annex.status
        });
      }
    }

    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Kiểm tra quyền xóa phụ lục
  async canDeleteAnnex(contractId, annex_code, user) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return { canDelete: false, message: 'Contract not found' };
    }

    const annex = contract.annexes.find(a => a.annex_code === annex_code);
    if (!annex) {
      return { canDelete: false, message: 'Annex not found' };
    }

    // Chỉ representative có thể xóa phụ lục
    if (user.role !== USER_ROLES.REPRESENTATIVE) {
      return { canDelete: false, message: 'Only representatives can delete annexes' };
    }

    // Chỉ có thể xóa phụ lục draft hoặc rejected
    if (annex.status !== ANNEX_STATUSES.DRAFT && annex.status !== ANNEX_STATUSES.REJECTED) {
      return { canDelete: false, message: 'Only draft or rejected annexes can be deleted' };
    }

    // Kiểm tra xem phụ lục có thuộc về user này không
    // Note: Annex không có created_by field, nên kiểm tra contract created_by
    if (contract.created_by.toString() !== user.userId) {
      return { canDelete: false, message: 'You can only delete annexes from your own contracts' };
    }

    return { canDelete: true };
  },

  // Xóa phụ lục
  async deleteAnnex(contractId, annex_code) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const annexIndex = contract.annexes.findIndex(a => a.annex_code === annex_code);
    if (annexIndex === -1) {
      throw new Error('Annex not found');
    }

    // Xóa phụ lục khỏi mảng
    contract.annexes.splice(annexIndex, 1);
    await contract.save();

    return contract;
  },

  // Helper function để lấy trạng thái hợp đồng tại một ngày cụ thể
  async getValidItemsAtDate(id, targetDate) {
    const contract = await Contract.findById(id)
      .populate('items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code');

    if (!contract) {
      throw new Error('Contract not found');
    }

    const targetDateTime = new Date(targetDate).getTime();
    const contractStartTime = new Date(contract.start_date).getTime();

    if (targetDateTime < contractStartTime) {
      throw new Error('Target date is before contract start date');
    }

    // Bắt đầu với items gốc
    let currentItems = [...contract.items];

    // Áp dụng các annex có signed_date <= targetDate và status = ACTIVE
    if (contract.annexes && contract.annexes.length > 0) {
      const validAnnexes = contract.annexes.filter(annex => 
        new Date(annex.signed_date).getTime() <= targetDateTime && 
        annex.status === ANNEX_STATUSES.ACTIVE
      );

      const sortedAnnexes = validAnnexes.sort((a, b) => 
        new Date(a.signed_date) - new Date(b.signed_date)
      );

      for (const annex of sortedAnnexes) {
        if (annex.medicine_changes) {
          // Xóa items
          if (annex.medicine_changes.remove_items) {
            const removeIds = annex.medicine_changes.remove_items.map(item => item.medicine_id.toString());
            currentItems = currentItems.filter(item => 
              !removeIds.includes(item.medicine_id._id.toString())
            );
          }

          // Cập nhật giá
          if (annex.medicine_changes.update_prices) {
            for (const update of annex.medicine_changes.update_prices) {
              const itemIndex = currentItems.findIndex(item => 
                item.medicine_id._id.toString() === update.medicine_id.toString()
              );
              if (itemIndex !== -1) {
                currentItems[itemIndex].price = update.new_price;
              }
            }
          }

          // Thêm items mới
          if (annex.medicine_changes.add_items) {
            currentItems.push(...annex.medicine_changes.add_items);
          }
        }
      }
    }

    return currentItems;
  },

  // Lấy tất cả thuốc có status active từ hợp đồng, bao gồm cả thuốc trong phụ lục
  async getActiveContractMedicines(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }

    const contract = await Contract.findById(id)
      .populate('items.medicine_id', 'medicine_name license_code status')
      .populate('annexes.medicine_changes.add_items.medicine_id', 'medicine_name license_code status')
      .populate('annexes.medicine_changes.remove_items.medicine_id', 'medicine_name license_code status')
      .populate('annexes.medicine_changes.update_prices.medicine_id', 'medicine_name license_code status');

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Bắt đầu với danh sách thuốc từ hợp đồng gốc (chỉ lấy thuốc có status active)
    let currentItems = contract.items.filter(item => 
      item.medicine_id && item.medicine_id.status === 'active'
    ).map(item => ({
      medicine_id: item.medicine_id,
      unit_price: item.unit_price,
      quantity: item.quantity || 1,
      min_order_quantity: item.min_order_quantity || 1,
      max_quantity: item.max_quantity || 1000
    }));

    // Áp dụng các thay đổi từ phụ lục active
    if (contract.annexes && contract.annexes.length > 0) {
      const activeAnnexes = contract.annexes
        .filter(annex => annex.status === ANNEX_STATUSES.ACTIVE)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      activeAnnexes.forEach(annex => {
        if (annex.medicine_changes) {
          const { add_items, remove_items, update_prices } = annex.medicine_changes;

          // Thêm thuốc mới (chỉ lấy thuốc có status active)
          if (add_items && add_items.length > 0) {
            const activeAddItems = add_items.filter(item => 
              item.medicine_id && item.medicine_id.status === 'active'
            );
            
            activeAddItems.forEach(addItem => {
              // Kiểm tra xem thuốc đã tồn tại chưa
              const existingItem = currentItems.find(
                item => item.medicine_id._id.toString() === addItem.medicine_id._id.toString()
              );
              if (!existingItem) {
                currentItems.push({
                  medicine_id: addItem.medicine_id,
                  unit_price: addItem.unit_price,
                  quantity: addItem.quantity || 1,
                  min_order_quantity: addItem.min_order_quantity || 1,
                  max_quantity: addItem.max_quantity || 1000
                });
              }
            });
          }

          // Xóa thuốc
          if (remove_items && remove_items.length > 0) {
            const removeIds = remove_items.map(item => item.medicine_id._id.toString());
            currentItems = currentItems.filter(
              item => !removeIds.includes(item.medicine_id._id.toString())
            );
          }

          // Cập nhật giá
          if (update_prices && update_prices.length > 0) {
            update_prices.forEach(updateItem => {
              const existingItem = currentItems.find(
                item => item.medicine_id._id.toString() === updateItem.medicine_id._id.toString()
              );
              if (existingItem) {
                existingItem.unit_price = updateItem.unit_price;
              }
            });
          }
        }
      });
    }

    return currentItems;
  },
};

module.exports = contractService;