import express from 'express';
import {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} from '../controllers/subjectController.js';

const router = express.Router();

router.get('/subjects', getAllSubjects);
router.get('/subjects/:id', getSubjectById);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

export default router;
