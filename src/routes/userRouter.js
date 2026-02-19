import express from 'express';

import { signUp, signIn, signUpWithOauth, mainPage, signInWithOauth, getOauthUrlSignIn, getOauthUrlSignUp } from '../controllers/userController.js';
import { Auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/Oauth/google/get/url/signIn', getOauthUrlSignIn);
router.get('/Oauth/google/get/url/signUp', getOauthUrlSignUp);
router.get('/Oauth/google/signUp', signUpWithOauth)
router.get('/Oauth/google/signIn', signInWithOauth)
router.get('/main', Auth, mainPage)
router.post('/signUp', signUp);
router.post('/signIn', signIn);

export default router;