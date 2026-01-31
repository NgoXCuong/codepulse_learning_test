import { Request, Response } from 'express';
import * as ChapterModel from '../models/ChapterModel.js';

export const getChaptersByCourseId = async (req: Request, res: Response) => {
    try {
        const chapters = await ChapterModel.getChaptersByCourseId(Number(req.params.courseId));
        res.json(chapters);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createChapter = async (req: Request, res: Response) => {
    try {
        const id = await ChapterModel.createChapter(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateChapter = async (req: Request, res: Response) => {
    try {
        const success = await ChapterModel.updateChapter(Number(req.params.id), req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy chương hoặc không có thay đổi nào được thực hiện' });
        }
        res.json({ message: 'Đã thay đổi chương thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteChapter = async (req: Request, res: Response) => {
    try {
        const success = await ChapterModel.deleteChapter(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy chương' });
        }
        res.json({ message: 'Đã xóa chương thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const reorderChapters = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const { chapterIds } = req.body;

        if (!Array.isArray(chapterIds)) {
            return res.status(400).json({ message: 'chapterIds phải là một mảng' });
        }

        await ChapterModel.reorderChapters(Number(courseId), chapterIds);
        res.json({ message: 'Đã cập nhật thứ tự chương thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
