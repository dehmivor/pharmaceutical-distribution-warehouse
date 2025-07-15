const express = require('express');
const router = express.Router();
const { principalContractValidator } = require('../middlewares/validate');
const principalContractController = require('../controllers/principalContractController');
const authenticate = require('../middlewares/authenticate');

router.get('/', principalContractValidator.validateGetAllContracts, principalContractController.getAllPrincipalContracts);

router.get('/detail/:id', authenticate, principalContractValidator.validateGetPrincipalContractById, principalContractController.getPrincipalContractById);

router.get('/filter-options', authenticate, principalContractController.getFilterOptions);

router.post('/', authenticate, principalContractValidator.validateCreatePrincipalContract, principalContractController.createPrincipalContract);

router.put('/:id', authenticate, principalContractValidator.validateUpdatePrincipalContract, principalContractController.updatePrincipalContract);

router.put('/:id/status', authenticate, principalContractValidator.validateUpdateContractStatus, principalContractController.updateContractStatus);

router.delete('/:id', authenticate, principalContractValidator.validateGetPrincipalContractById, principalContractController.deletePrincipalContract);

router.post('/:id/annexes', authenticate, principalContractValidator.validateCreateAnnex, principalContractController.createAnnex);

router.put('/:id/annexes/:annex_code', authenticate, principalContractValidator.validateUpdateAnnex, principalContractController.updateAnnex);

router.put('/:id/annexes/:annex_code/status', authenticate, principalContractValidator.validateUpdateAnnexStatus, principalContractController.updateAnnexStatus);

module.exports = router;