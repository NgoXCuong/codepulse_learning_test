const API_URL = '/api';

async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || error.error || 'API Request Failed');
    }
    return res.json();
}

window.api = {
    // Courses
    getCourses: () => fetchAPI('/courses'),
    createCourse: (data) => fetchAPI('/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteCourse: (id) => fetchAPI(`/courses/${id}`, { method: 'DELETE' }),

    // Chapters
    getChapters: (courseId) => fetchAPI(`/chapters/course/${courseId}`),
    createChapter: (data) => fetchAPI('/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updateChapter: (id, data) => fetchAPI(`/chapters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteChapter: (id) => fetchAPI(`/chapters/${id}`, { method: 'DELETE' }),
    reorderChapters: (courseId, chapterIds) => fetchAPI(`/chapters/reorder/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterIds })
    }),

    // Lessons
    getLessons: (chapterId) => fetchAPI(`/lessons/chapter/${chapterId}`),
    createLesson: (data) => fetchAPI('/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteLesson: (id) => fetchAPI(`/lessons/${id}`, { method: 'DELETE' }),

    // Contents
    getContents: (lessonId) => fetchAPI(`/contents/lesson/${lessonId}`),
    createContent: (data) => fetchAPI('/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updateContent: (id, data) => fetchAPI(`/contents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteContent: (id) => fetchAPI(`/contents/${id}`, { method: 'DELETE' }),
    reorderContents: (lessonId, contentIds) => fetchAPI(`/contents/reorder/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds })
    }),

    // Exercises
    getExercises: (lessonId) => fetchAPI(`/exercises/lesson/${lessonId}`),
    getExercisesByChapter: (chapterId) => fetchAPI(`/exercises/chapter/${chapterId}`),
    getExercise: (id) => fetchAPI(`/exercises/${id}`),
    createExercise: (data) => fetchAPI('/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updateExercise: (id, data) => fetchAPI(`/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteExercise: (id) => fetchAPI(`/exercises/${id}`, { method: 'DELETE' }),

    // Test Cases
    getTestCases: (exerciseId) => fetchAPI(`/exercises/${exerciseId}/test-cases`),
    createTestCase: (data) => fetchAPI('/exercises/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    updateTestCase: (id, data) => fetchAPI(`/exercises/test-cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }),
    deleteTestCase: (id) => fetchAPI(`/exercises/test-cases/${id}`, { method: 'DELETE' })
};
