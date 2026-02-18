import express from 'express';

import { signUp, signIn, signUpWithOauth, getOauthUrl, mainPage } from '../controllers/userController.js';
import { Auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/auth/google', getOauthUrl)
router.get('/auth/callback', signUpWithOauth)
router.get('/main', Auth, mainPage)
router.post('/signUp', signUp);
router.post('/signIn', signIn);

export default router;