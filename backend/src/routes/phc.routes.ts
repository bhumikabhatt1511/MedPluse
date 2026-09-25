import { Router } from 'express';
import {
  getPHCs,
  getPHCById,
  createPHC,
  updatePHC,
  getPHCRisk,
} from '../controllers/phc.controller.js';
import {
  getPHCInventory,
  restockMedicine,
} from '../controllers/medicine.controller.js';

const router = Router();

router.get('/', getPHCs);
router.get('/:id', getPHCById);
router.post('/', createPHC);
router.put('/:id', updatePHC);
router.get('/:id/risk', getPHCRisk);
router.get('/:phcId/inventory', getPHCInventory);
router.post('/:phcId/inventory/restock', restockMedicine);

export default router;
