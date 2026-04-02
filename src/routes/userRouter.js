import express from 'express';

import * as userController from '../controllers/userController.js';
import { Auth } from '../middlewares/authMiddleware.js';
import * as rateLimit from '../middlewares/rateLimit.js';
import * as validate from '../middlewares/validate.js';

const router = express.Router();

router.get('/Oauth/google/get/url/signIn', rateLimit.Oauth2UrlLimit, userController.getOauthUrlSignIn);
router.get('/Oauth/google/get/url/signUp', rateLimit.Oauth2UrlLimit, userController.getOauthUrlSignUp);
router.get('/Oauth/signUp', rateLimit.Oauth2AuthenticationLimit, userController.signUpWithOauth);
router.get('/Oauth/signIn', rateLimit.Oauth2AuthenticationLimit, userController.signInWithOauth);
router.get('/main', rateLimit.mainPageLimit, Auth, userController.mainPage);
router.post('/signUp', rateLimit.aunteticacaoLimit, validate.signUpValidate, userController.signUp);
router.post('/signIn', rateLimit.aunteticacaoLimit, validate.signInValidate, userController.signIn);
router.post('/change-password', rateLimit.aunteticacaoLimit, Auth, validate.changePasswordValidate, userController.changePassword);

export default router;