const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate'); // middleware vừa sửa

// === AUTHENTICATION ROUTES ===
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// === VALIDATION ROUTES ===
router.get('/validate', authenticate, authController.validateSession);
router.get('/me', authenticate, authController.getCurrentUser);

// === ROLE-BASED REDIRECT ===
router.get('/redirect', authenticate, authController.getRoleBasedRedirect);

module.exports = router;
