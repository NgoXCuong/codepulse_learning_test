import { Request, Response } from 'express';
import * as LessonModel from '../models/LessonModel.js';

export const getLessonsByChapterId = async (req: Request, res: Response) => {
    try {
        const lessons = await LessonModel.getLessonsByChapterId(Number(req.params.chapterId));
        res.json(lessons);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createLesson = async (req: Request, res: Response) => {
    try {
        const id = await LessonModel.createLesson(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateLesson = async (req: Request, res: Response) => {
    try {
        const success = await LessonModel.updateLesson(Number(req.params.id), req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy bài học hoặc không có thay đổi nào được thực hiện' });
        }
        res.json({ message: 'Đã thay thay đổi bài học thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteLesson = async (req: Request, res: Response) => {
    try {
        const success = await LessonModel.deleteLesson(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }
        res.json({ message: 'Đã xóa bài học thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
