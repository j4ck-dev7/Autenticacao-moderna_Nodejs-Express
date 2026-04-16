import express from 'express';

import * as userController from '../controllers/userController.js';
import { Auth } from '../middlewares/authMiddleware.js';
import * as rateLimit from '../middlewares/rateLimit.js';
import * as validate from '../middlewares/validate.js';
import * as slowDown from '../middlewares/slowDownMiddleware.js';

const router = express.Router();

router.get('/Oauth/google/get/url/signIn', slowDown.Oauth2UrlSlowDown, rateLimit.Oauth2UrlLimit, userController.getOauthUrlSignIn);
router.get('/Oauth/google/get/url/signUp', slowDown.Oauth2UrlSlowDown, rateLimit.Oauth2UrlLimit, userController.getOauthUrlSignUp);
router.get('/Oauth/signUp', slowDown.Oauth2SlowDown, rateLimit.Oauth2AuthenticationLimit, userController.signUpWithOauth);
router.get('/Oauth/signIn', slowDown.Oauth2SlowDown, rateLimit.Oauth2AuthenticationLimit, userController.signInWithOauth);
router.get('/main', slowDown.mainPageSlowDown, rateLimit.mainPageLimit, Auth, userController.mainPage);
router.get('/verify-email', slowDown.verifyEmailSlowDown, rateLimit.verifyEmailLimit, userController.verifyEmail);
router.post('/signUp', slowDown.createUserSlowDown, rateLimit.autenticacaoLimit, validate.signUpValidate, userController.signUp);
router.post('/signIn', slowDown.authenticationSlowDown, rateLimit.autenticacaoLimit, validate.signInValidate, userController.signIn);
router.post('/change-password', slowDown.authenticationSlowDown, rateLimit.autenticacaoLimit, Auth, validate.changePasswordValidate, userController.changePassword);

export default router;