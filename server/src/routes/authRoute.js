const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

// === AUTHENTICATION ROUTES ===
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login/step1', authController.loginStep1);
router.post('/login/step2', authController.loginStep2);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// === VALIDATION ROUTES ===
router.get('/validate', authenticate, authController.validateSession);
router.get('/me', authenticate, authController.getCurrentUser);

// === ROLE-BASED REDIRECT ===
router.get('/redirect', authenticate, authController.getRoleBasedRedirect);

module.exports = router;
