import { Router } from 'express';
import * as CourseController from '../controllers/courseController.js';

const router = Router();

router.get('/', CourseController.getAllCourses);
router.get('/:id', CourseController.getCourseById);
router.post('/', CourseController.createCourse);
router.put('/:id', CourseController.updateCourse);
router.delete('/:id', CourseController.deleteCourse);

export default router;
