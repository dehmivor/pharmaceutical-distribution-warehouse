const SupplierContract = require('../models/SupplierContract');
const mongoose = require('mongoose');
const { CONTRACT_STATUSES } = require('../utils/constants');

const supplierContractService = {
  async getAllSupplierContracts({ page, limit, created_by, supplier_id, status, contract_code }) {
    const query = {};

    // Apply filters
    if (created_by && mongoose.Types.ObjectId.isValid(created_by)) {
      query.created_by = created_by;
    }
    if (supplier_id && mongoose.Types.ObjectId.isValid(supplier_id)) {
      query.supplier_id = supplier_id;
    }
    if (status && Object.values(CONTRACT_STATUSES).includes(status)) {
      query.status = status;
    }

    // Apply contract_code search filter
    if (contract_code) {
      query.contract_code = { $regex: contract_code, $options: 'i' }; // Case-insensitive search
    }

    const skip = (page - 1) * limit;
    const contracts = await SupplierContract.find(query)
      .populate('created_by', 'name email')
      .populate('supplier_id', 'name')
      .populate('items.medicine_id', 'license_code')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SupplierContract.countDocuments(query);

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

  async createSupplierContract(contractData) {
    // Set default status to 'draft' if not provided
    if (!contractData.status) {
      contractData.status = CONTRACT_STATUSES.DRAFT;
    }

    // Validate references exist
    const [userExists, supplierExists] = await Promise.all([
      mongoose.model('User').exists({ _id: contractData.created_by }),
      mongoose.model('Supplier').exists({ _id: contractData.supplier_id }),
    ]);

    if (!userExists) {
      throw new Error('Invalid created_by: User does not exist');
    }
    if (!supplierExists) {
      throw new Error('Invalid supplier_id: Supplier does not exist');
    }

    // Validate medicine_ids in items
    if (contractData.items && contractData.items.length > 0) {
      const medicineIds = contractData.items.map((item) => item.medicine_id);
      const medicinesExist = await mongoose
        .model('Medicine')
        .find({ _id: { $in: medicineIds } })
        .countDocuments();
      if (medicinesExist !== medicineIds.length) {
        throw new Error('One or more medicine IDs are invalid');
      }
      // Ensure kpi_details is an array (empty or non-empty)
      contractData.items.forEach((item) => {
        item.kpi_details = item.kpi_details || [];
        if (item.kpi_details.length > 0) {
          const minSaleQuantities = item.kpi_details.map((kpi) => kpi.min_sale_quantity);
          const uniqueMinSaleQuantities = new Set(minSaleQuantities);
          if (minSaleQuantities.length !== uniqueMinSaleQuantities.size) {
            throw new Error('Duplicate min_sale_quantity values are not allowed in kpi_details');
          }

          const sortedKpiDetails = [...item.kpi_details].sort(
            (a, b) => a.min_sale_quantity - b.min_sale_quantity,
          );
          for (let i = 1; i < sortedKpiDetails.length; i++) {
            if (
              sortedKpiDetails[i].profit_percentage <= sortedKpiDetails[i - 1].profit_percentage
            ) {
              throw new Error('Profit percentage must increase with higher min_sale_quantity');
            }
          }
        }
      });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newContract = await SupplierContract.create([contractData], { session });
      const populatedContract = await SupplierContract.findById(newContract[0]._id)
        .populate('created_by', 'name email')
        .populate('supplier_id', 'name')
        .populate('items.medicine_id', 'license_code')
        .session(session);
      await session.commitTransaction();
      return populatedContract;
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

  async getSupplierContractById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return SupplierContract.findById(id)
      .populate('created_by', 'name email')
      .populate('supplier_id', 'name')
      .populate('items.medicine_id', 'medicine_name')
      .lean();
  },

  async deleteSupplierContract(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid contract ID');
    }
    const contract = await SupplierContract.findById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (contract.status !== CONTRACT_STATUSES.DRAFT) {
      throw new Error('Only contracts with status draft can be deleted');
    }
    return SupplierContract.findByIdAndDelete(id);
  },
};

module.exports = supplierContractService;
