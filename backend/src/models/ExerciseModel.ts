import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';

export interface CodingExercise {
    exercise_id?: number;
    lesson_id?: number | null;
    chapter_id?: number | null;
    exercise_order?: number;
    title: string;
    instruction: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    starter_code?: string;
    solution_code?: string;
    programming_language?: string;
    created_at?: Date;
}

export interface TestCase {
    test_case_id?: number;
    exercise_id: number;
    input?: string;
    expected_output: string;
    is_hidden?: boolean;
    points?: number;
}

// --- Exercises ---

export const getExercisesByLessonId = async (lessonId: number): Promise<CodingExercise[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM coding_exercises WHERE lesson_id = ? ORDER BY exercise_order', [lessonId]);
    return rows as CodingExercise[];
};

export const getExercisesByChapterId = async (chapterId: number): Promise<CodingExercise[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM coding_exercises WHERE chapter_id = ? ORDER BY exercise_order', [chapterId]);
    return rows as CodingExercise[];
};

export const getExerciseById = async (id: number): Promise<CodingExercise | null> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM coding_exercises WHERE exercise_id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0] as CodingExercise;
};

export const createExercise = async (exercise: CodingExercise): Promise<number> => {
    const { lesson_id, chapter_id, exercise_order, title, instruction, difficulty, starter_code, solution_code, programming_language } = exercise;
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO coding_exercises 
        (lesson_id, chapter_id, exercise_order, title, instruction, difficulty, starter_code, solution_code, programming_language) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lesson_id || null, chapter_id || null, exercise_order || 1, title, instruction, difficulty || 'Easy', starter_code, solution_code, programming_language]
    );
    return result.insertId;
};

export const updateExercise = async (id: number, exercise: Partial<CodingExercise>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (exercise.lesson_id !== undefined) { fields.push('lesson_id = ?'); values.push(exercise.lesson_id); }
    if (exercise.chapter_id !== undefined) { fields.push('chapter_id = ?'); values.push(exercise.chapter_id); }
    if (exercise.exercise_order) { fields.push('exercise_order = ?'); values.push(exercise.exercise_order); }
    if (exercise.title) { fields.push('title = ?'); values.push(exercise.title); }
    if (exercise.instruction) { fields.push('instruction = ?'); values.push(exercise.instruction); }
    if (exercise.difficulty) { fields.push('difficulty = ?'); values.push(exercise.difficulty); }
    if (exercise.starter_code !== undefined) { fields.push('starter_code = ?'); values.push(exercise.starter_code); }
    if (exercise.solution_code !== undefined) { fields.push('solution_code = ?'); values.push(exercise.solution_code); }
    if (exercise.programming_language !== undefined) { fields.push('programming_language = ?'); values.push(exercise.programming_language); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE coding_exercises SET ${fields.join(', ')} WHERE exercise_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteExercise = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM coding_exercises WHERE exercise_id = ?', [id]);
    return result.affectedRows > 0;
};

// --- Test Cases ---

export const getTestCasesByExerciseId = async (exerciseId: number): Promise<TestCase[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM test_cases WHERE exercise_id = ?', [exerciseId]);
    return rows as TestCase[];
};

export const createTestCase = async (testCase: TestCase): Promise<number> => {
    const { exercise_id, input, expected_output, is_hidden, points } = testCase;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO test_cases (exercise_id, input, expected_output, is_hidden, points) VALUES (?, ?, ?, ?, ?)',
        [exercise_id, input, expected_output, is_hidden !== undefined ? is_hidden : true, points || 1]
    );
    return result.insertId;
};

export const updateTestCase = async (id: number, testCase: Partial<TestCase>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (testCase.input !== undefined) { fields.push('input = ?'); values.push(testCase.input); }
    if (testCase.expected_output !== undefined) { fields.push('expected_output = ?'); values.push(testCase.expected_output); }
    if (testCase.is_hidden !== undefined) { fields.push('is_hidden = ?'); values.push(testCase.is_hidden); }
    if (testCase.points !== undefined) { fields.push('points = ?'); values.push(testCase.points); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE test_cases SET ${fields.join(', ')} WHERE test_case_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteTestCase = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM test_cases WHERE test_case_id = ?', [id]);
    return result.affectedRows > 0;
};
