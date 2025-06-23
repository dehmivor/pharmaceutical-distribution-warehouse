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

// === PASSWORD RESET ROUTES ===
// Forgot password - gửi OTP
router.post('/forgot-password', authController.forgotPassword);

// Verify reset token - để frontend kiểm tra token hợp lệ
router.post('/verify-reset-token', authController.verifyResetToken);

// Reset password với token
router.post('/reset-password', authController.resetPassword);

// === VALIDATION ROUTES ===
router.get('/validate', authenticate, authController.validateSession);
router.get('/me', authenticate, authController.getCurrentUser);

// === ROLE-BASED REDIRECT ===
router.get('/redirect', authenticate, authController.getRoleBasedRedirect);
router.post('/activate-account', authController.activateAccount);
module.exports = router;
