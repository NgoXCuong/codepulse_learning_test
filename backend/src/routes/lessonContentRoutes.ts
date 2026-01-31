import { Router } from 'express';
import * as LessonContentController from '../controllers/lessonContentController.js';

const router = Router();

// GET /api/contents/lesson/:lessonId
router.get('/lesson/:lessonId', LessonContentController.getContentByLessonId);
router.post('/reorder/:lessonId', LessonContentController.reorderContents); // New Reorder Route
router.post('/', LessonContentController.createContent);
router.put('/:id', LessonContentController.updateContent);
router.delete('/:id', LessonContentController.deleteContent);

export default router;
