import { Router } from 'express';
import { getOriginals, getOriginalById } from '../controllers/originalsController.js';

const router = Router();

router.get('/',    getOriginals);
router.get('/:id', getOriginalById);

export default router;
