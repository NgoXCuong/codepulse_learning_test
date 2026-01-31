import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';

export interface Course {
    course_id?: number;
    course_name: string;
    main_language: string;
    course_description?: string;
    course_image?: string;
    difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced';
    created_at?: Date;
    updated_at?: Date;
    is_active?: boolean;
}

export const getAllCourses = async (): Promise<Course[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM courses WHERE is_active = TRUE');
    return rows as Course[];
};

export const getCourseById = async (id: number): Promise<Course | null> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM courses WHERE course_id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0] as Course;
};

export const createCourse = async (course: Course): Promise<number> => {
    const { course_name, main_language, course_description, course_image, difficulty_level } = course;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO courses (course_name, main_language, course_description, course_image, difficulty_level) VALUES (?, ?, ?, ?, ?)',
        [course_name, main_language, course_description, course_image, difficulty_level || 'Beginner']
    );
    return result.insertId;
};

export const updateCourse = async (id: number, course: Partial<Course>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (course.course_name) { fields.push('course_name = ?'); values.push(course.course_name); }
    if (course.main_language) { fields.push('main_language = ?'); values.push(course.main_language); }
    if (course.course_description) { fields.push('course_description = ?'); values.push(course.course_description); }
    if (course.course_image) { fields.push('course_image = ?'); values.push(course.course_image); }
    if (course.difficulty_level) { fields.push('difficulty_level = ?'); values.push(course.difficulty_level); }
    if (course.is_active !== undefined) { fields.push('is_active = ?'); values.push(course.is_active); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE courses SET ${fields.join(', ')} WHERE course_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteCourse = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM courses WHERE course_id = ?', [id]);
    return result.affectedRows > 0;
};
