import { Router } from 'express';
import * as LessonController from '../controllers/lessonController.js';

const router = Router();

router.get('/chapter/:chapterId', LessonController.getLessonsByChapterId);
router.post('/', LessonController.createLesson);
router.put('/:id', LessonController.updateLesson);
router.delete('/:id', LessonController.deleteLesson);

export default router;
