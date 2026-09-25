import { Router } from 'express';
import {
  getMedicines,
  getPHCInventory,
  getShortages,
  getExpiring,
  restockMedicine,
} from '../controllers/medicine.controller.js';

const router = Router();

router.get('/', getMedicines);
router.get('/shortages', getShortages);
router.get('/expiring', getExpiring);
router.get('/phc/:phcId', getPHCInventory);
router.post('/phc/:phcId/restock', restockMedicine);

export default router;
