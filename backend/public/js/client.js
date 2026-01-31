// Client Logic for Student Interface

// Utils
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// --- API Calls (Reusing existing endpoints) ---
const fetchCourses = async () => (await fetch("/api/courses")).json();
const fetchChapters = async (courseId) =>
  (await fetch(`/api/chapters/course/${courseId}`)).json();
const fetchLessons = async (chapterId) =>
  (await fetch(`/api/lessons/chapter/${chapterId}`)).json();
const fetchContents = async (lessonId) =>
  (await fetch(`/api/contents/lesson/${lessonId}`)).json();
const fetchExercises = async (lessonId) =>
  (await fetch(`/api/exercises/lesson/${lessonId}`)).json();
const fetchChapterExercises = async (chapterId) =>
  (await fetch(`/api/exercises/chapter/${chapterId}`)).json();

// --- Home Page Logic ---
async function initHome() {
  const grid = document.getElementById("course-grid");
  if (!grid) return; // Not on home page

  grid.innerHTML = '<div class="loading">Loading courses...</div>';
  try {
    const courses = await fetchCourses();
    grid.innerHTML = "";
    if (courses.length === 0) {
      grid.innerHTML = '<div class="loading">No courses available yet.</div>';
      return;
    }

    courses.forEach((course) => {
      const card = document.createElement("div");
      card.className = "course-card";
      card.innerHTML = `
                <div class="card-img"><i class="fas fa-code"></i></div>
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between;">
                        <div class="badge">${course.difficulty_level}</div>
                        <div class="badge" style="background:#e0e7ff; color:#3730a3">${course.main_language}</div>
                    </div>
                    <h3 class="card-title">${course.course_name}</h3>
                    <p class="card-desc">${course.course_description || "No description available."}</p>
                    <a href="learn.html?courseId=${course.course_id}" class="btn">Start Learning</a>
                </div>
            `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML =
      '<div class="loading" style="color:red">Failed to load courses.</div>';
  }
}

// --- Learn Page Logic ---
let currentLessonId = null;
let courseStructure = []; // Flat list for navigation? Or nested? Nested is better for render, flat for nav.
let flatLessonList = []; // For Next/Prev navigation

async function initLearn() {
  const courseId = getQueryParam("courseId");
  const sidebar = document.getElementById("sidebar-content");
  const contentArea = document.getElementById("content-area");
  const courseTitle = document.getElementById("course-title");

  if (!courseId || !sidebar) return; // Not on learn page or missing params

  // Load Course Info
  try {
    const courses = await fetchCourses();
    const course = courses.find((c) => c.course_id == courseId);
    if (course) {
      courseTitle.innerText = course.course_name;
      document.title = `${course.course_name} - CodePulse`;
    }
  } catch (e) {
    console.error("Error loading course info");
  }

  // Load Structure (Chapters & Lessons)
  sidebar.innerHTML = '<div class="loading">Loading syllabus...</div>';
  try {
    const chapters = await fetchChapters(courseId);
    sidebar.innerHTML = "";
    flatLessonList = [];

    for (const chapter of chapters) {
      // Render Chapter Header
      const chapEl = document.createElement("div");
      chapEl.className = "chapter-item";
      chapEl.innerHTML = `<div class="chapter-title">${chapter.chapter_name}</div>`;
      sidebar.appendChild(chapEl);

      // Fetch & Render Lessons
      const lessons = await fetchLessons(chapter.chapter_id);

      // Add "Chapter Exercises" Item to Sidebar if exists?
      // Let's just add a distinct item "Bài tập chương"
      const lessonContainer = document.createElement("div");

      if (lessons.length > 0) {
        lessons.forEach((lesson) => {
          // Add to flat list for navigation
          flatLessonList.push({
            lesson_id: lesson.lesson_id,
            lesson_name: lesson.lesson_name,
            chapter_id: chapter.chapter_id,
          });

          const lessEl = document.createElement("div");
          lessEl.className = "lesson-item";
          lessEl.dataset.id = lesson.lesson_id;
          lessEl.innerHTML = `<i class="fas fa-play-circle lesson-icon"></i> ${lesson.lesson_name}`;
          lessEl.onclick = () => loadLesson(lesson);
          lessonContainer.appendChild(lessEl);
        });
      }

      // Check for Chapter Exercises
      const exercises = await fetchChapterExercises(chapter.chapter_id);
      if (exercises && exercises.length > 0) {
        const chapExEl = document.createElement("div");
        chapExEl.className = "lesson-item";
        chapExEl.dataset.id = `chap-${chapter.chapter_id}`;
        chapExEl.innerHTML = `<i class="fas fa-code lesson-icon"></i>  Bài Tập Chương`;
        chapExEl.onclick = () => loadChapterExercises(chapter);
        lessonContainer.appendChild(chapExEl);
      }

      chapEl.appendChild(lessonContainer);
    }

    // Auto-load first lesson
    if (flatLessonList.length > 0) {
      loadLesson(flatLessonList[0]);
    } else {
      contentArea.innerHTML =
        '<div class="loading">No lessons in this course yet.</div>';
    }
  } catch (err) {
    console.error(err);
    sidebar.innerHTML =
      '<div class="loading" style="color:red">Error loading syllabus</div>';
  }
}

async function loadLesson(lesson) {
  currentLessonId = lesson.lesson_id;
  const contentArea = document.getElementById("content-area");

  // Update active UI
  document
    .querySelectorAll(".lesson-item")
    .forEach((el) => el.classList.remove("active"));
  const activeEl = document.querySelector(
    `.lesson-item[data-id="${lesson.lesson_id}"]`,
  );
  if (activeEl) activeEl.classList.add("active");

  contentArea.innerHTML = '<div class="loading">Loading content...</div>';

  try {
    const contents = await fetchContents(lesson.lesson_id);
    let exercises = [];
    try {
      exercises = await fetchExercises(lesson.lesson_id);
    } catch (e) {}

    // Render
    let html = `
            <div class="lesson-header">
                <h1 class="lesson-title">${lesson.lesson_name}</h1>
            </div>

            <div class="lesson-tabs" style="display:flex; gap:10px; margin-bottom:1rem; border-bottom:1px solid #e0e7ff;">
                <button class="tab-btn active" id="btn-theory" onclick="switchLessonTab('theory')" style="padding:0.5rem 1rem; border:none; background:transparent; border-bottom:2px solid #3730a3; font-weight:600; cursor:pointer;">Lý thuyết</button>
                <button class="tab-btn" id="btn-exercise" onclick="switchLessonTab('exercise')" style="padding:0.5rem 1rem; border:none; background:transparent; border-bottom:2px solid transparent; color:#666; cursor:pointer;">Bài tập (${exercises.length})</button>
            </div>
        `;

    // --- Theory Tab ---
    html += `<div id="tab-theory" style="display:block;">`;
    if (contents.length === 0) {
      html += '<p style="color:#666">Chưa có nội dung lý thuyết.</p>';
    } else {
      contents.forEach((block) => {
        if (block.content_type === "code") {
          html += `
                        <div class="content-block">
                            ${block.content_title ? `<h3>${block.content_title}</h3>` : ""}
                            <div class="content-code">
                                <div class="code-header">
                                    <span>Code</span>
                                    ${block.code_language ? `<span class="code-badge">${block.code_language}</span>` : ""}
                                </div>
                                <pre>${escapeHtml(block.body)}</pre>
                            </div>
                            ${block.code_explanation ? `<div class="code-explanation"><strong>Giải thích:</strong> ${renderMarkdown(block.code_explanation)}</div>` : ""}
                        </div>
                    `;
        } else {
          html += `
                        <div class="content-block">
                             ${block.content_title ? `<h3>${block.content_title}</h3>` : ""}
                            <div class="content-text">${renderMarkdown(block.body)}</div>
                        </div>
                    `;
        }
      });
    }
    html += `</div>`; // End Theory Tab

    // --- Exercise Tab ---
    html += `<div id="tab-exercise" style="display:none;">`;
    if (exercises.length > 0) {
      html += `<div class="exercise-section" style="margin-top:1rem;">
            <h2><i class="fas fa-terminal"></i> Bài tập thực hành</h2>`;

      exercises.forEach((ex) => {
        html += `
                <div class="exercise-card" style="margin-bottom:2rem; border:1px solid #e0e7ff; border-radius:8px; padding:1.5rem;">
                    <h3>${ex.title} <span class="badge" style="font-size:0.8rem">${ex.difficulty}</span></h3>
                     <div style="background:#f9fafb; padding:1rem; border-radius:4px; margin-bottom:1rem;">
                        ${renderMarkdown(ex.instruction)}
                    </div>

                    <div class="code-editor-area">
                        <div style="margin-bottom:0.5rem; font-weight:600;">Solution:</div>
                        <textarea id="ex-code-${ex.exercise_id}" class="form-control" rows="8" style="font-family:monospace; background:#1e1e1e; color:#d4d4d4; width:100%; border-radius:4px;">${ex.starter_code || "// Viết code của bạn ở đây..."}</textarea>
                        
                        <div style="margin-top:1rem; display:flex; justify-content:space-between;">
                             <button class="btn btn-primary" onclick="runCode(${ex.exercise_id})">Chạy Code</button>
                             <div id="ex-result-${ex.exercise_id}" style="font-family:monospace; color:#333;"></div>
                        </div>
                    </div>
                </div>
            `;
      });
      html += `</div>`;
    } else {
      html +=
        '<p style="color:#666; padding:1rem;">Bài học này chưa có bài tập nào.</p>';
    }
    html += `</div>`; // End Exercise Tab
    const currentIndex = flatLessonList.findIndex(
      (l) => l.lesson_id === lesson.lesson_id,
    );
    const prevLesson = flatLessonList[currentIndex - 1];
    const nextLesson = flatLessonList[currentIndex + 1];

    html += `
            <div class="lesson-nav">
                ${prevLesson ? `<div class="nav-btn" onclick="loadLessonById(${prevLesson.lesson_id})"><i class="fas fa-arrow-left"></i> Previous</div>` : "<div></div>"}
                ${nextLesson ? `<div class="nav-btn" onclick="loadLessonById(${nextLesson.lesson_id})">Next <i class="fas fa-arrow-right"></i></div>` : "<div></div>"}
            </div>
        `;

    contentArea.innerHTML = html;
  } catch (err) {
    contentArea.innerHTML =
      '<div class="loading" style="color:red">Error loading content</div>';
  }
}

// --- Tab Switching Logic ---
window.switchLessonTab = (tabName) => {
  // 1. Toggle Buttons
  document.getElementById("btn-theory").style.borderBottom =
    tabName === "theory" ? "2px solid #3730a3" : "2px solid transparent";
  document.getElementById("btn-theory").style.color =
    tabName === "theory" ? "#000" : "#666";

  document.getElementById("btn-exercise").style.borderBottom =
    tabName === "exercise" ? "2px solid #3730a3" : "2px solid transparent";
  document.getElementById("btn-exercise").style.color =
    tabName === "exercise" ? "#000" : "#666";

  // 2. Toggle Content
  document.getElementById("tab-theory").style.display =
    tabName === "theory" ? "block" : "none";
  document.getElementById("tab-exercise").style.display =
    tabName === "exercise" ? "block" : "none";
};

// Helpers
function loadLessonById(id) {
  const lesson = flatLessonList.find((l) => l.lesson_id === id);
  if (lesson) loadLesson(lesson);
}

function escapeHtml(text) {
  return text
    ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";
}

function renderMarkdown(text) {
  if (!text) return "";

  // Split into lines for proper block processing
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  lines.forEach((line, index) => {
    // Sanitize first
    let safeLine = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // List Item detection (- or *)
    const listMatch = safeLine.match(/^\s*(-|\*)\s+(.*)$/);

    if (listMatch) {
      if (!inList) {
        html += '<ul class="content-list">';
        inList = true;
      }
      // Process inline formatting for list item
      let content = listMatch[2];
      content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html += `<li>${content}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }

      // Headings
      if (safeLine.startsWith("### ")) {
        html += `<h3>${safeLine.substring(4)}</h3>`;
      } else if (safeLine.startsWith("## ")) {
        html += `<h2>${safeLine.substring(3)}</h2>`;
      } else if (safeLine.startsWith("# ")) {
        html += `<h1>${safeLine.substring(2)}</h1>`;
      } else if (safeLine.startsWith("> ")) {
        html += `<blockquote>${safeLine.substring(2)}</blockquote>`;
      } else if (safeLine.trim() === "") {
        // Empty line (paragraph break) - optional, or just let CSS handle p margins
        // html += '<br>';
      } else {
        // Regular paragraph / text line
        // Inline formatting
        let content = safeLine;
        content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // If previous line was also text, maybe append?
        // For simplicity, wrap non-empty lines in div/p or just append with br
        html += `<p>${content}</p>`;
      }
    }
  });

  if (inList) {
    html += "</ul>";
  }

  return html;
}

window.loadChapterExercises = async (chapter) => {
  currentLessonId = null; // Unset lesson
  const contentArea = document.getElementById("content-area");

  // UI Active State
  document
    .querySelectorAll(".lesson-item")
    .forEach((el) => el.classList.remove("active"));
  const activeEl = document.querySelector(
    `.lesson-item[data-id="chap-${chapter.chapter_id}"]`,
  );
  if (activeEl) activeEl.classList.add("active");

  contentArea.innerHTML = '<div class="loading">Đang tải bài tập...</div>';

  try {
    const exercises = await fetchChapterExercises(chapter.chapter_id);

    let html = `
            <div class="lesson-header">
                <h1 class="lesson-title">${chapter.chapter_name} - Bài Tập Tổng Hợp</h1>
            </div>
        `;

    if (exercises.length === 0) {
      html += "<p>Chưa có bài tập nào cho chương này.</p>";
    } else {
      exercises.forEach((ex) => {
        html += `
                    <div class="exercise-card" style="margin-bottom:2rem; border:1px solid #e0e7ff; border-radius:8px; padding:1.5rem;">
                        <h3>${ex.title} <span class="badge" style="font-size:0.8rem">${ex.difficulty}</span></h3>
                        <div style="background:#f9fafb; padding:1rem; border-radius:4px; margin-bottom:1rem;">
                            ${renderMarkdown(ex.instruction)}
                        </div>

                        <div class="code-editor-area">
                            <div style="margin-bottom:0.5rem; font-weight:600;">Solution:</div>
                            <textarea id="ex-code-${ex.exercise_id}" class="form-control" rows="8" style="font-family:monospace; background:#1e1e1e; color:#d4d4d4; width:100%; border-radius:4px;">${ex.starter_code || "// Viết code của bạn ở đây..."}</textarea>
                            
                            <div style="margin-top:1rem; display:flex; justify-content:space-between;">
                                 <button class="btn btn-primary" onclick="runCode(${ex.exercise_id})">Chạy thử (Run Hub)</button>
                                 <div id="ex-result-${ex.exercise_id}" style="font-family:monospace; color:#333;"></div>
                            </div>
                        </div>
                    </div>
                `;
      });
    }
    contentArea.innerHTML = html;
  } catch (e) {
    contentArea.innerHTML =
      '<div class="loading" style="color:red">Lỗi tải bài tập</div>';
  }
};

window.runCode = (id) => {
  const resultDiv = document.getElementById(`ex-result-${id}`);
  resultDiv.innerHTML = '<span style="color:blue">Đang chạy...</span>';
  // Mock execution
  setTimeout(() => {
    resultDiv.innerHTML =
      '<span style="color:green">Kết quả chính xác! (Mô phỏng)</span>';
  }, 1000);
};

// Init
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("course-grid")) initHome();
  if (document.getElementById("sidebar-content")) initLearn();
});
