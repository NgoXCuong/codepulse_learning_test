import { Router } from 'express';
import * as ChapterController from '../controllers/chapterController.js';

const router = Router();

router.get('/course/:courseId', ChapterController.getChaptersByCourseId);
router.post('/', ChapterController.createChapter);
router.put('/:id', ChapterController.updateChapter);
router.delete('/:id', ChapterController.deleteChapter);

export default router;
