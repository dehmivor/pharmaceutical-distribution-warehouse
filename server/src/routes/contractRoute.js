const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// router.use(authenticate);

router.post('/', authorize(['representative','supervisor']), contractController.createContract);
router.get('/', authorize(['representative','supervisor']), contractController.getContractsByStatus);
router.get('/my', authorize(['representative','supervisor']), contractController.getContractsByCreator);
router.patch('/:id/status', authorize(['supervisor']), contractController.updateContractStatus);
router.delete('/:id', authorize(['supervisor']), contractController.deleteContract);
router.get('/:id', contractController.getContractById);

module.exports = router;
