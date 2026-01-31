import { Request, Response } from 'express';
import * as LessonContentModel from '../models/LessonContentModel.js';

export const getContentByLessonId = async (req: Request, res: Response) => {
    try {
        const contents = await LessonContentModel.getContentByLessonId(Number(req.params.lessonId));
        res.json(contents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createContent = async (req: Request, res: Response) => {
    try {
        const id = await LessonContentModel.createContent(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateContent = async (req: Request, res: Response) => {
    try {
        const success = await LessonContentModel.updateContent(Number(req.params.id), req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy nội dung bài học hoặc không có thay đổi nào được thực hiện' });
        }
        res.json({ message: 'Nội dung đã được thay đổi thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteContent = async (req: Request, res: Response) => {
    try {
        const success = await LessonContentModel.deleteContent(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ message: 'Khóa học không tồn tại' });
        }
        res.json({ message: 'Đã xóa khóa học thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const reorderContents = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;
        const { contentIds } = req.body;

        if (!Array.isArray(contentIds)) {
            return res.status(400).json({ message: 'contentIds phải là một mảng' });
        }

        await LessonContentModel.reorderContents(Number(lessonId), contentIds);
        res.json({ message: 'Đã cập nhật thứ tự nội dung thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
