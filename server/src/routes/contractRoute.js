const express = require('express');
const router = express.Router();
const { contractValidator } = require('../middlewares/validate');
const contractController = require('../controllers/contractController');
const authenticate = require('../middlewares/authenticate');

router.get('/', contractValidator.validateGetAllContracts, contractController.getAllContracts);

router.get('/:id', authenticate, contractValidator.validateGetContractById, contractController.getContractById);

router.get('/detail/:id', authenticate, contractValidator.validateGetContractById, contractController.getContractById);

router.get('/filter-options', authenticate, contractController.getFilterOptions);

router.post('/', authenticate, contractValidator.validateCreateContract, contractController.createContract);

router.put('/:id', authenticate, contractValidator.validateUpdateContract, contractController.updateContract);

router.put('/:id/status', authenticate, contractValidator.validateUpdateContractStatus, contractController.updateContractStatus);

router.delete('/:id', authenticate, contractValidator.validateGetContractById, contractController.deleteContract);

router.post('/:id/annexes', authenticate, contractValidator.validateCreateAnnex, contractController.createAnnex);

router.put('/:id/annexes/:annex_code', authenticate, contractValidator.validateUpdateAnnex, contractController.updateAnnex);

router.put('/:id/annexes/:annex_code/status', authenticate, contractValidator.validateUpdateAnnexStatus, contractController.updateAnnexStatus);

module.exports = router;