import { Request, Response } from 'express';
import * as CourseModel from '../models/CourseModel.js';

export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await CourseModel.getAllCourses();
        res.json(courses);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourseById = async (req: Request, res: Response) => {
    try {
        const course = await CourseModel.getCourseById(Number(req.params.id));
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        }
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const id = await CourseModel.createCourse(req.body);
        res.status(201).json({ id, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const success = await CourseModel.updateCourse(Number(req.params.id), req.body);
        if (!success) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học hoặc không có thay đổi nào được thực hiện' });
        }
        res.json({ message: 'Đã thay đổi khóa học thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const success = await CourseModel.deleteCourse(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ message: 'Không thìm thấy khóa học' });
        }
        res.json({ message: 'Đã xóa khóa học thành công' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
