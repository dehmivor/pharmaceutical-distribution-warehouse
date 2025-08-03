const express = require('express');
const router = express.Router();
const { contractValidator } = require('../middlewares/validate');
const contractController = require('../controllers/contractController');
const authenticate = require('../middlewares/authenticate');

// API cơ bản
router.get('/', contractValidator.validateGetAllContracts, contractController.getAllContracts);
router.get('/:id', authenticate, contractValidator.validateGetContractById, contractController.getContractById);

router.get('/detail/:id', authenticate, contractValidator.validateGetContractById, contractController.getContractById);
router.get('/:id/medicines', authenticate, contractValidator.validateGetContractById, contractController.getActiveContractMedicines);
router.post('/', authenticate, contractValidator.validateCreateContract, contractController.createContract);
router.put('/:id', authenticate, contractValidator.validateUpdateContract, contractController.updateContract);
router.put('/:id/status', authenticate, contractValidator.validateUpdateContractStatus, contractController.updateContractStatus);
router.delete('/:id', authenticate, contractValidator.validateGetContractById, contractController.deleteContract);

// API phụ lục
router.post('/:id/annexes', authenticate, contractValidator.validateCreateAnnex, contractController.createAnnex);
router.put('/:id/annexes/:annex_code', authenticate, contractValidator.validateUpdateAnnex, contractController.updateAnnex);
router.put('/:id/annexes/:annex_code/status', authenticate, contractValidator.validateUpdateAnnexStatus, contractController.updateAnnexStatus);
router.delete('/:id/annexes/:annex_code', authenticate, contractController.deleteAnnex);

// UC6: Lấy lịch sử thay đổi hợp đồng
router.get('/:id/history', authenticate, contractController.getContractHistory);

module.exports = router;