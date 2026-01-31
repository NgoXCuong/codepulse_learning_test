import express from 'express';
import * as exerciseController from '../controllers/exerciseController.js';

const router = express.Router();

// --- Exercises ---
router.get('/lesson/:lessonId', exerciseController.getExercisesByLesson);
router.get('/chapter/:chapterId', exerciseController.getExercisesByChapter);
router.post('/', exerciseController.createExercise);
router.get('/:id', exerciseController.getExercise);
router.put('/:id', exerciseController.updateExercise);
router.delete('/:id', exerciseController.deleteExercise);

// --- Test Cases ---
router.get('/:exerciseId/test-cases', exerciseController.getTestCases);
router.post('/test-cases', exerciseController.addTestCase);
router.put('/test-cases/:id', exerciseController.updateTestCase);
router.delete('/test-cases/:id', exerciseController.deleteTestCase);

export default router;
