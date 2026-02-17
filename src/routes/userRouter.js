import express from 'express';

import { signUp, signIn, signUpWithOauth, getOauthUrl } from '../controllers/userController.js';

const router = express.Router();

router.get('/auth/google', getOauthUrl)
router.get('/auth/callback', signUpWithOauth)
router.post('/signUp', signUp);
router.post('/signIn', signIn);

export default router;