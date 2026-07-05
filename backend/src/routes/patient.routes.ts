import { Router } from 'express';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient, getPatientHistory } from '../controllers/patient.controller';

const router = Router();

router.get('/', getPatients);
router.get('/:id', getPatient);
router.get('/:id/history', getPatientHistory);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
