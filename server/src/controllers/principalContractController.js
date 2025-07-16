const principalContractService = require('../services/principalContractService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { CONTRACT_STATUSES, PARTNER_TYPES, ANNEX_STATUSES } = require('../utils/constants');

const getAllPrincipalContracts = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    page = 1,
    limit = 10,
    created_by,
    partner_id,
    partner_type,
    status,
    contract_code,
  } = req.query;

  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    created_by,
    partner_id,
    partner_type,
    status,
    contract_code,
  };

  const contracts = await principalContractService.getAllPrincipalContracts(filters);
  res.status(200).json({
    success: true,
    data: contracts,
  });
});

const getPrincipalContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await principalContractService.getPrincipalContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  res.status(200).json({ success: true, data: contract });
});

const createPrincipalContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const contractData = {
    ...req.body,
    created_by: req.user.userId,
  };

  const newContract = await principalContractService.createPrincipalContract(contractData);
  res.status(201).json({ success: true, data: newContract });
});

const getFilterOptions = asyncHandler(async (req, res) => {
  try {
    const options = {
      status: Object.values(CONTRACT_STATUSES),
      partner_type: Object.values(PARTNER_TYPES),
      annex_status: Object.values(ANNEX_STATUSES),
    };

    res.status(200).json({
      success: true,
      message: 'Lấy tùy chọn bộ lọc thành công',
      data: options,
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tùy chọn bộ lọc',
    });
  }
});

const deletePrincipalContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await principalContractService.getPrincipalContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  if (contract.created_by._id.toString() !== req.user.userId) {
    return res
      .status(403)
      .json({ success: false, message: 'You do not have permission to delete this contract' });
  }
  if (
    contract.status !== CONTRACT_STATUSES.DRAFT &&
    contract.status !== CONTRACT_STATUSES.CANCELLED
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Only draft and cancelled contracts can be deleted' });
  }

  const result = await principalContractService.deletePrincipalContract(id);
  if (!result) {
    return res.status(500).json({ success: false, message: 'Failed to delete contract' });
  }

  res.status(200).json({ success: true });
});

const updatePrincipalContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await principalContractService.getPrincipalContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  if (contract.created_by._id.toString() !== req.user.userId) {
    return res
      .status(403)
      .json({ success: false, message: 'You do not have permission to update this contract' });
  }
  if (
    contract.status !== CONTRACT_STATUSES.DRAFT &&
    contract.status !== CONTRACT_STATUSES.CANCELLED
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Only draft and cancelled contracts can be updated' });
  }

  const updatedContract = await principalContractService.updatePrincipalContract(id, req.body);
  res.status(200).json({ success: true, data: updatedContract });
});

const updateContractStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  const { id } = req.params;
  const { status } = req.body;

  const updatedContract = await principalContractService.updateContractStatus(id, status, req.user);

  return res.status(200).json({ success: true, data: updatedContract });
});

const createAnnex = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const annexData = {
    ...req.body,
    created_by: req.user.userId,
  };

  const updatedContract = await principalContractService.createAnnex(id, annexData);
  res.status(201).json({ success: true, data: updatedContract });
});

const updateAnnex = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, annex_code } = req.params;
  const annexData = req.body;

  const updatedContract = await principalContractService.updateAnnex(
    id,
    annex_code,
    annexData,
    req.user,
  );
  res.status(200).json({ success: true, data: updatedContract });
});

const updateAnnexStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, annex_code } = req.params;
  const { status } = req.body;

  const updatedContract = await principalContractService.updateAnnexStatus(
    id,
    annex_code,
    status,
    req.user,
  );
  res.status(200).json({ success: true, data: updatedContract });
});

module.exports = {
  getAllPrincipalContracts,
  getPrincipalContractById,
  createPrincipalContract,
  getFilterOptions,
  deletePrincipalContract,
  updatePrincipalContract,
  updateContractStatus,
  createAnnex,
  updateAnnex,
  updateAnnexStatus,
};
