const express = require('express');
const router = express.Router();
const { economicContractValidator } = require('../middlewares/validate');
const economicContractController = require('../controllers/economicContractController');
const authenticate = require('../middlewares/authenticate');

router.get('/', economicContractValidator.validateGetAllContracts, economicContractController.getAllEconomicContracts);

router.get('/detail/:id', authenticate, economicContractValidator.validateGetEconomicContractById, economicContractController.getEconomicContractById);

router.get('/filter-options', authenticate, economicContractController.getFilterOptions);

router.post('/', authenticate, economicContractValidator.validateCreateEconomicContract, economicContractController.createEconomicContract);

router.put('/:id', authenticate, economicContractValidator.validateUpdateEconomicContract, economicContractController.updateEconomicContract);

router.put('/:id/status', authenticate, economicContractValidator.validateUpdateStatus, economicContractController.updateContractStatus);

router.delete('/:id', authenticate, economicContractValidator.validateGetEconomicContractById, economicContractController.deleteEconomicContract);

module.exports = router;
