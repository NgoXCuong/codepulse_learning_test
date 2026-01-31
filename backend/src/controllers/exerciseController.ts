import { Request, Response } from 'express';
import * as ExerciseModel from '../models/ExerciseModel.js';

export const getExercisesByLesson = async (req: Request, res: Response) => {
    try {
        const lessonId = Number(req.params.lessonId);
        const exercises = await ExerciseModel.getExercisesByLessonId(lessonId);
        res.json(exercises);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getExercisesByChapter = async (req: Request, res: Response) => {
    try {
        const chapterId = Number(req.params.chapterId);
        const exercises = await ExerciseModel.getExercisesByChapterId(chapterId);
        res.json(exercises);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getExercise = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const exercise = await ExerciseModel.getExerciseById(id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json(exercise);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createExercise = async (req: Request, res: Response) => {
    try {
        const id = await ExerciseModel.createExercise(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExercise = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const success = await ExerciseModel.updateExercise(id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập hoặc không có thay đổi' });
        }
        res.json({ message: 'Cập nhật bài tập thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteExercise = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const success = await ExerciseModel.deleteExercise(id);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy bài tập' });
        }
        res.json({ message: 'Xóa bài tập thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Test Cases ---

export const getTestCases = async (req: Request, res: Response) => {
    try {
        const exerciseId = Number(req.params.exerciseId);
        const testCases = await ExerciseModel.getTestCasesByExerciseId(exerciseId);
        res.json(testCases);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addTestCase = async (req: Request, res: Response) => {
    try {
        const id = await ExerciseModel.createTestCase(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTestCase = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const success = await ExerciseModel.updateTestCase(id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy test case hoặc không có thay đổi' });
        }
        res.json({ message: 'Cập nhật test case thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTestCase = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const success = await ExerciseModel.deleteTestCase(id);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy test case' });
        }
        res.json({ message: 'Xóa test case thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
