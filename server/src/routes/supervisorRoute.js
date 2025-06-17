const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate');

router.get('/users', authenticate, userController.getAllUsers);

module.exports = router;
