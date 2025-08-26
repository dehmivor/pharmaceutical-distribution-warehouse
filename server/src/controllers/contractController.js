const contractService = require('../services/contractService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const {
  CONTRACT_STATUSES,
  PARTNER_TYPES,
  ANNEX_STATUSES,
  CONTRACT_TYPES,
} = require('../utils/constants');

const getAllContracts = asyncHandler(async (req, res) => {
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
    contract_type,
    status,
    contract_code,
  } = req.query;

  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    created_by,
    partner_id,
    partner_type,
    contract_type,
    status,
    contract_code,
  };

  const contracts = await contractService.getAllContracts(filters);

  // Thêm filter options vào response
  const filterOptions = {
    status: Object.values(CONTRACT_STATUSES),
    partner_type: Object.values(PARTNER_TYPES),
    contract_type: Object.values(CONTRACT_TYPES),
    annex_status: Object.values(ANNEX_STATUSES),
  };

  res.status(200).json({
    success: true,
    data: contracts,
    filterOptions,
  });
});

const getContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await contractService.getContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  // Nếu là principal contract, thêm current state
  let currentState = null;
  if (contract.contract_type === CONTRACT_TYPES.PRINCIPAL) {
    currentState = await contractService.getCurrentContractState(id);
  }

  res.status(200).json({
    success: true,
    data: contract,
    currentState,
  });
});

const createContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const contractData = {
    ...req.body,
    created_by: req.user.userId,
  };

  // Nếu có annexes, validate trước khi tạo
  if (contractData.annexes && contractData.annexes.length > 0) {
    const validation = await contractService.validateExistingContractWithAnnexes(contractData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Contract validation failed: ${validation.errors.join(', ')}`,
      });
    }
  }

  const newContract = await contractService.createContract(contractData);
  res.status(201).json({ success: true, data: newContract });
});

const deleteContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await contractService.getContractById(id);
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

  const result = await contractService.deleteContract(id);
  if (!result) {
    return res.status(500).json({ success: false, message: 'Failed to delete contract' });
  }

  res.status(200).json({ success: true });
});

const updateContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const { id } = req.params;

  const contract = await contractService.getContractById(id);

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
    contract.status !== CONTRACT_STATUSES.REJECTED
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Only draft and rejected contracts can be updated' });
  }

  const updatedContract = await contractService.updateContract(id, req.body);

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

  const updatedContract = await contractService.updateContractStatus(id, status, req.user);

  const creatorId = updatedContract.created_by?._id || updatedContract.created_by || null;
  const contractCode = updatedContract.contract_code || updatedContract._id || id;

  const newNotification = await notificationService.createNotification(
    {
      recipient_id: creatorId,
      sender_id: req.user?.userId || null,
      title: 'Hợp đồng đã được lưu',
      message: `Hợp đồng mã #${contractCode.toString().slice(20)} đã duyệt lúc ${new Date().toLocaleString()}`,
      type: 'system_alert',
      priority: 'high',
      status: 'unread',
      metadata: {
        contractId: contractCode,
        statusChangedTo: status,
      },
    },
    io,
  );

  if (newNotification && io) {
    console.log('Emitting newNotification to system room');
    io.to('system').emit('newNotification', newNotification);
  } else {
    console.log('Cannot emit: io =', io);
  }

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

  // Validate ngày ký phụ lục trước khi tạo
  const dateValidation = await contractService.validateAnnexSignedDate(id, annexData);
  if (!dateValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid signed date: ${dateValidation.errors.join(', ')}`,
    });
  }

  // Validate medicine changes trước khi tạo
  const medicineValidation = await contractService.validateNewAnnex(id, annexData);
  if (!medicineValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid annex: ${medicineValidation.errors.join(', ')}`,
    });
  }

  const updatedContract = await contractService.createAnnex(id, annexData);
  res.status(201).json({ success: true, data: updatedContract });
});

const updateAnnex = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, annex_code } = req.params;
  const annexData = req.body;

  // Kiểm tra có thể chỉnh sửa phụ lục không
  const canEdit = await contractService.canEditAnnex(id, annex_code);
  if (!canEdit.canEdit) {
    return res.status(400).json({
      success: false,
      message: canEdit.message,
    });
  }

  // Validate medicine changes trước khi cập nhật
  const medicineValidation = await contractService.validateNewAnnex(id, annexData);
  if (!medicineValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid annex: ${medicineValidation.errors.join(', ')}`,
    });
  }

  const updatedContract = await contractService.updateAnnex(id, annex_code, annexData, req.user);
  res.status(200).json({ success: true, data: updatedContract });
});

const updateAnnexStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, annex_code } = req.params;
  const { status } = req.body;

  const updatedContract = await contractService.updateAnnexStatus(id, annex_code, status, req.user);
  res.status(200).json({ success: true, data: updatedContract });
});

const deleteAnnex = asyncHandler(async (req, res) => {
  const { id, annex_code } = req.params;

  // Kiểm tra quyền xóa phụ lục
  const canDelete = await contractService.canDeleteAnnex(id, annex_code, req.user);
  if (!canDelete.canDelete) {
    return res.status(400).json({
      success: false,
      message: canDelete.message,
    });
  }

  const updatedContract = await contractService.deleteAnnex(id, annex_code);
  res.status(200).json({ success: true, data: updatedContract });
});

// UC6: Lấy lịch sử thay đổi hợp đồng
const getContractHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const history = await contractService.getContractHistory(id);
  if (!history) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  res.status(200).json({
    success: true,
    data: history,
  });
});

const getActiveContractMedicines = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const medicines = await contractService.getActiveContractMedicines(id);
    res.status(200).json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract,
  createAnnex,
  updateAnnex,
  updateAnnexStatus,
  deleteAnnex,
  getContractHistory,
  getActiveContractMedicines,
};
