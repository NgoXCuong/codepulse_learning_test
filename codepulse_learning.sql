-- 1. Khởi tạo Database
CREATE DATABASE IF NOT EXISTS codepulse_learning 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE codepulse_learning;

-- 2. Bảng Khóa học (Courses)
-- Đã thêm main_language và không để DEFAULT để bắt buộc nhập liệu
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    main_language VARCHAR(50) NOT NULL, -- Ngôn ngữ chính của khóa học
    course_description TEXT,
    course_image VARCHAR(500),
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 3. Bảng Chương học (Chapters)
CREATE TABLE chapters (
    chapter_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    chapter_name VARCHAR(255) NOT NULL,
    chapter_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Bảng Bài học (Lessons)
CREATE TABLE lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    lesson_name VARCHAR(255) NOT NULL,
    lesson_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Bảng Nội dung bài học (Lesson Contents)
-- code_language được để NULL để linh hoạt cho các bài học chỉ có lý thuyết
CREATE TABLE lesson_contents (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    content_type ENUM('theory', 'code') NOT NULL, 
    content_order INT NOT NULL,
    content_title VARCHAR(255),
    body TEXT NOT NULL,
    code_language VARCHAR(50) DEFAULT NULL, -- Có thể NULL nếu là nội dung lý thuyết
    code_explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    INDEX idx_lesson_order (lesson_id, content_order)
) ENGINE=InnoDB;


-- 1. Bảng Bài tập lập trình (Coding Exercises)
CREATE TABLE IF NOT EXISTS coding_exercises (
    exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT DEFAULT NULL,    -- Có thể NULL nếu là bài tập tổng hợp chương
    chapter_id INT DEFAULT NULL,   -- Có thể NULL nếu là bài tập nhỏ sau mỗi bài học
    exercise_order INT DEFAULT 1,  -- Thứ tự bài tập
    title VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,      -- Mô tả yêu cầu bài tập
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    
    -- Phần Code mẫu
    starter_code TEXT,             -- Đoạn code gợi ý ban đầu cho học viên
    solution_code TEXT,            -- Code đáp án để hệ thống đối chiếu (nếu cần)
    
    -- Cấu hình kỹ thuật
    programming_language VARCHAR(50), -- Ví dụ: 'javascript', 'python', 'php'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    -- Đảm bảo bài tập phải nằm trong 1 bài học hoặc 1 chương
    CONSTRAINT chk_location CHECK (lesson_id IS NOT NULL OR chapter_id IS NOT NULL)
) ENGINE=InnoDB;

-- 2. Bảng Bộ kiểm thử (Test Cases)
CREATE TABLE IF NOT EXISTS test_cases (
    test_case_id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT NOT NULL,
    input TEXT,                    -- Dữ liệu đầu vào (stdin)
    expected_output TEXT NOT NULL,  -- Kết quả đầu ra mong đợi (stdout)
    is_hidden BOOLEAN DEFAULT TRUE, -- Test case ẩn hay hiện cho người dùng
    points INT DEFAULT 1,           -- Điểm cho mỗi test case đúng
    FOREIGN KEY (exercise_id) REFERENCES coding_exercises(exercise_id) ON DELETE CASCADE
) ENGINE=InnoDB;