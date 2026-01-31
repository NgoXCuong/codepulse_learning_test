import express from 'express';
import * as exerciseController from '../controllers/exerciseController.js';

const router = express.Router();

// --- Exercises ---
// Lấy danh sách bài tập theo bài học
router.get('/lesson/:lessonId', exerciseController.getExercisesByLesson);

// Lấy danh sách bài tập theo chương
router.get('/chapter/:chapterId', exerciseController.getExercisesByChapter);

// Tạo bài tập mới
router.post('/', exerciseController.createExercise);

// Lấy chi tiết bài tập
router.get('/:id', exerciseController.getExercise);

// Cập nhật bài tập
router.put('/:id', exerciseController.updateExercise);

// Xóa bài tập
router.delete('/:id', exerciseController.deleteExercise);

// --- Test Cases ---

// Lấy danh sách test cases của một bài tập
router.get('/:exerciseId/test-cases', exerciseController.getTestCases);

// Thêm test case cho bài tập
router.post('/test-cases', exerciseController.addTestCase);

// Cập nhật test case
router.put('/test-cases/:id', exerciseController.updateTestCase);

// Xóa test case
router.delete('/test-cases/:id', exerciseController.deleteTestCase);

export default router;
