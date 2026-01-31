// Global Error Handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
  alert("JavaScript Error: " + msg + "\nLine: " + lineNo);
  return false;
};

// DOM Elements
const dashboardView = document.getElementById("dashboard-view");
const courseEditorView = document.getElementById("course-editor-view");
const courseGrid = document.getElementById("course-grid");
const courseTreeRoot = document.getElementById("course-tree-root");
const editorArea = document.getElementById("editor-area");
const activeCourseNameFn = document.getElementById("active-course-name");

// Generic Modal Elements
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
let modalSave = document.getElementById("modal-save");
let modalCancel = document.getElementById("modal-cancel");

// State
let currentCourseId = null;
let expandedNodes = new Set(); // For tree state in sidebar

document.addEventListener("DOMContentLoaded", () => {
  showDashboard();

  if (modalCancel) {
    modalCancel.addEventListener("click", closeModal);
  } else {
    console.error("Critical: Modal Cancel button not found in DOM");
  }
});

// --- View Switching ---
window.showDashboard = () => {
  currentCourseId = null;
  dashboardView.classList.remove("hidden");
  courseEditorView.classList.add("hidden");
  dashboardView.classList.add("active");
  loadDashboard();
};

window.showCourseEditor = async (courseId) => {
  currentCourseId = courseId;
  dashboardView.classList.add("hidden");
  dashboardView.classList.remove("active");
  courseEditorView.classList.remove("hidden");

  // Reset Editor Area
  editorArea.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <h3>Chọn Bài Học hoặc Chương</h3>
            <p>Chọn một chương hoặc bài học từ danh sách bên trái để chỉnh sửa.</p>
        </div>`;

  await loadCourseHierarchy(courseId);
};

// --- Dashboard Logic ---

async function loadDashboard() {
  courseGrid.innerHTML = '<div style="color:#666">Loading courses...</div>';
  try {
    const courses = await api.getCourses();
    renderCourseGrid(courses);
  } catch (err) {
    courseGrid.innerHTML = `<div style="color:red">Error: ${err.message}</div>`;
  }
}

function renderCourseGrid(courses) {
  courseGrid.innerHTML = "";
  courses.forEach((course) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
            <h3>${course.course_name}</h3>
            <p>${course.course_description || "No description"}</p>
            <div class="meta">
                <span class="badge">${course.difficulty_level}</span>
                <span class="badge" style="background:#e0e7ff; color:#3730a3">${course.main_language}</span>
                <span>ID: ${course.course_id}</span>
            </div>
            <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showCourseEditor(${course.course_id})">Manage</button>
                <button class="btn btn-sm btn-outline" style="border:1px solid #ccc; color:#333" onclick="event.stopPropagation(); editCourseMeta(${course.course_id})">Edit Info</button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteItem('course', ${course.course_id})">Delete</button>
            </div>
        `;
    card.addEventListener("click", () => showCourseEditor(course.course_id));
    courseGrid.appendChild(card);
  });
}

// --- Course Editor Logic (Sidebar) ---
async function loadCourseHierarchy(courseId) {
  courseTreeRoot.innerHTML =
    '<div style="padding:1rem; color:#888;">Loading structure...</div>';
  try {
    const courses = await api.getCourses();
    const course = courses.find((c) => c.course_id === courseId);
    if (course) activeCourseNameFn.innerText = course.course_name;

    // Fetch Chapters
    const chapters = await api.getChapters(courseId);
    renderSidebarTree(chapters);
  } catch (err) {
    courseTreeRoot.innerHTML = `<div style="padding:1rem; color:red;">Error loading hierarchy</div>`;
  }
}

function renderSidebarTree(chapters) {
  courseTreeRoot.innerHTML = "";
  if (chapters.length === 0) {
    courseTreeRoot.innerHTML =
      '<div style="padding:1rem; font-style:italic; color:#666">No chapters yet. Add one above.</div>';
    return;
  }

  chapters.forEach((chapter) => {
    const node = createSidebarNode(chapter, "chapter");
    courseTreeRoot.appendChild(node);
  });
}

function createSidebarNode(item, type) {
  const el = document.createElement("div");
  const nodeId = `${type}-${item.chapter_id || item.lesson_id}`;
  const hasChildren = type === "chapter"; // Chapters have lessons
  const isExpanded = expandedNodes.has(nodeId);

  let actionsHtml = "";
  if (type === "chapter") {
    actionsHtml = `
            <div class="tree-actions" style="margin-left:auto; display:flex; gap:5px;">
                <button class="btn-icon" title="Lên" onclick="event.stopPropagation(); moveChapter(${item.chapter_id}, -1)"><i class="fas fa-chevron-up"></i></button>
                <button class="btn-icon" title="Xuống" onclick="event.stopPropagation(); moveChapter(${item.chapter_id}, 1)"><i class="fas fa-chevron-down"></i></button>
                <button class="btn-icon" title="Thêm Bài Học" onclick="event.stopPropagation(); createChild('lesson', ${item.chapter_id})"><i class="fas fa-plus"></i></button>
                <button class="btn-icon" title="Sửa tên" onclick="event.stopPropagation(); editItem('chapter', ${item.chapter_id}, '${encodeURIComponent(item.chapter_name).replace(/'/g, "%27")}')"><i class="fas fa-pencil"></i></button>
                <button class="btn-icon" title="Chi tiết" onclick="event.stopPropagation(); loadChapterEditor({chapter_id: ${item.chapter_id}, chapter_name: decodeURIComponent('${encodeURIComponent(item.chapter_name).replace(/'/g, "%27")}')})"><i class="fas fa-cog"></i></button>
                <button class="btn-icon" title="Xóa" style="color:#ef4444" onclick="event.stopPropagation(); deleteItem('chapter', ${item.chapter_id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
  } else {
    // Lesson
    actionsHtml = `
             <div class="tree-actions" style="margin-left:auto; display:flex; gap:5px;">
                <button class="btn-icon" title="Delete" style="color:#ef4444" onclick="event.stopPropagation(); deleteItem('lesson', ${item.lesson_id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
  }

  el.innerHTML = `
        <div class="tree-node ${isExpanded ? "expanded" : ""}" data-id="${nodeId}" data-type="${type}">
             <span class="tree-toggle">${hasChildren ? '<i class="fas fa-chevron-right"></i>' : ""}</span>
             <span class="tree-icon">${type === "chapter" ? '<i class="fas fa-folder"></i>' : '<i class="fas fa-file-alt"></i>'}</span>
             <span class="tree-text">${item.chapter_name || item.lesson_name}</span>
             ${actionsHtml}
        </div>
        <div class="tree-children ${isExpanded ? "show" : ""}" id="children-${nodeId}"></div>
    `;

  const nodeHeader = el.querySelector(".tree-node");
  const toggleBtn = el.querySelector(".tree-toggle");
  const childrenContainer = el.querySelector(".tree-children");

  if (hasChildren) {
    nodeHeader.onclick = async (e) => {
      const wasExpanded = nodeHeader.classList.contains("expanded");
      if (wasExpanded) {
        nodeHeader.classList.remove("expanded");
        childrenContainer.classList.remove("show");
        expandedNodes.delete(nodeId);
      } else {
        nodeHeader.classList.add("expanded");
        childrenContainer.classList.add("show");
        expandedNodes.add(nodeId);
        if (childrenContainer.innerHTML === "") {
          await loadLessons(item.chapter_id, childrenContainer);
        }
      }
    };

    if (isExpanded) {
      loadLessons(item.chapter_id, childrenContainer);
    }
  } else {
    nodeHeader.onclick = () => {
      document
        .querySelectorAll(".tree-node")
        .forEach((n) => n.classList.remove("active"));
      nodeHeader.classList.add("active");
      loadLessonEditor(item);
    };
  }

  return el;
}

async function loadLessons(chapterId, container) {
  container.innerHTML =
    '<div style="padding-left:1.5rem; font-size:0.8rem; color:#666;">Loading...</div>';
  try {
    const lessons = await api.getLessons(chapterId);
    container.innerHTML = "";
    if (lessons.length === 0) {
      container.innerHTML =
        '<div style="padding-left:1.5rem; font-size:0.8rem; color:#666">No basic lessons</div>';
      return;
    }
    lessons.forEach((lesson) => {
      container.appendChild(createSidebarNode(lesson, "lesson"));
    });
  } catch (e) {
    container.innerHTML = '<div style="color:red">Error</div>';
  }
}

// --- Chapter Editor (New) ---

window.moveChapter = async (chapterId, direction) => {
  if (!currentCourseId) return;

  let chapters = await api.getChapters(currentCourseId);

  const index = chapters.findIndex((c) => c.chapter_id === chapterId);
  if (index === -1) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= chapters.length) return;

  const temp = chapters[index];
  chapters[index] = chapters[newIndex];
  chapters[newIndex] = temp;

  const orderedIds = chapters.map((c) => c.chapter_id);
  await api.reorderChapters(currentCourseId, orderedIds);

  loadCourseHierarchy(currentCourseId);
};

window.loadChapterEditor = async (chapter) => {
  editorArea.innerHTML =
    '<div style="padding:2rem;">Đang tải nội dung...</div>';

  try {
    let exercises = [];
    try {
      exercises = await api.getExercisesByChapter(chapter.chapter_id);
    } catch (e) {}

    editorArea.innerHTML = `
            <div class="editor-header">
                <h2>${chapter.chapter_name}</h2>
                <button class="btn btn-sm btn-outline" onclick="editItem('chapter', ${chapter.chapter_id}, '${encodeURIComponent(chapter.chapter_name).replace(/'/g, "%27")}')">Đổi tên Chương</button>
            </div>
            
            <div style="padding:1rem; border:1px solid #e0e7ff; border-radius:8px; margin-bottom:1rem; background:#f9fafb;">
                <p>Quản lý các bài tập tổng hợp cho chương này.</p>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem; margin-bottom:1rem;">
                <h3>Bài tập Chương</h3>
                <button class="btn btn-sm btn-primary" onclick="createExercise(${chapter.chapter_id}, null, true)">+ Thêm Bài Tập</button>
            </div>
            <div id="exercise-list">
                 ${exercises
                   .map(
                     (e) => `
                    <div class="child-item" style="border-left: 4px solid #3730a3;">
                        <div>
                            <strong>${e.title}</strong> (${e.difficulty}) <br>
                            <small style="color:#666">${e.instruction.substring(0, 80)}...</small>
                        </div>
                        <div style="display:flex;">
                            <button class="btn btn-sm btn-outline" style="margin-right:0.5rem; color: black" onclick="manageTestCases(${e.exercise_id})">Bộ Test</button>
                            <button class="btn btn-sm btn-outline" style="margin-right:0.5rem; color: black" onclick="editExercise(${e.exercise_id}, '${encodeURIComponent(e.title).replace(/'/g, "%27")}', null, true)">Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem('exercise', ${e.exercise_id}, null, true)">Xóa</button>
                        </div>
                    </div>
                `,
                   )
                   .join("")}
                ${exercises.length === 0 ? "<p>Chưa có bài tập nào.</p>" : ""}
            </div>
        `;
  } catch (e) {
    editorArea.innerHTML =
      '<div style="padding:2rem; color:red">Lỗi tải nội dung</div>';
  }
};

// --- Content Editor (Right Side) ---
let currentLessonContentsMap = [];

window.moveContent = async (contentId, direction, lessonId, btn) => {
  let contents = await api.getContents(lessonId);

  const index = contents.findIndex((c) => c.content_id === contentId);
  if (index === -1) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= contents.length) return; // Boundary check

  const temp = contents[index];
  contents[index] = contents[newIndex];
  contents[newIndex] = temp;

  const orderedIds = contents.map((c) => c.content_id);
  await api.reorderContents(lessonId, orderedIds);

  loadLessonEditor({ lesson_id: lessonId, lesson_name: "Refreshing..." });
};

async function loadLessonEditor(lesson) {
  editorArea.innerHTML =
    '<div style="padding:2rem;">Đang tải nội dung...</div>';

  try {
    let contents = [];
    let exercises = [];
    try {
      contents = await api.getContents(lesson.lesson_id);
      exercises = await api.getExercises(lesson.lesson_id);
    } catch (e) {}

    renderLessonEditor(lesson, contents, exercises);
  } catch (e) {
    editorArea.innerHTML =
      '<div style="padding:2rem; color:red">Lỗi tải nội dung</div>';
  }
}

function renderLessonEditor(lesson, contents, exercises = []) {
  editorArea.innerHTML = `
        <div class="editor-header">
            <h2>${lesson.lesson_name}</h2>
            <button class="btn btn-sm btn-outline" style="color: black" onclick="editItem('lesson', ${lesson.lesson_id})">Đổi tên Bài</button>
        </div>
        
        <div class="child-list">
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3>Nội dung bài học</h3>
                <button class="btn btn-sm btn-primary" onclick="createContent(${lesson.lesson_id})">+ Thêm Nội Dung</button>
            </div>
            <div id="content-list">
                ${contents
                  .map((c) => {
                    const safeEnc = (str) =>
                      encodeURIComponent(str || "").replace(/'/g, "%27");
                    return `
                    <div class="child-item">
                        <div style="display:flex; flex-direction:column; align-items:center; margin-right: 10px; gap: 2px;">
                            <button class="btn-icon" title="Lên" onclick="moveContent(${c.content_id}, -1, ${lesson.lesson_id}, this)" style="padding:2px;"><i class="fas fa-chevron-up"></i></button>
                            <button class="btn-icon" title="Xuống" onclick="moveContent(${c.content_id}, 1, ${lesson.lesson_id}, this)" style="padding:2px;"><i class="fas fa-chevron-down"></i></button>
                        </div>
                        <div style="flex:1;">
                            <strong>${(c.content_type || "theory").toUpperCase()}</strong>: ${c.content_title || "No Title"} <br>
                            <small style="color:#666">${c.body ? c.body.substring(0, 80) + "..." : ""}</small>
                        </div>
                        <div style="display:flex; align-items: flex-start;">
                            <button class="btn btn-sm btn-outline" style="margin-right:0.5rem; color: black" onclick="editContent(${c.content_id}, '${c.content_type || "theory"}', '${safeEnc(c.content_title)}', '${safeEnc(c.body)}', ${lesson.lesson_id}, '${safeEnc(c.code_explanation)}', '${safeEnc(c.code_language)}')">Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem('content', ${c.content_id}, ${lesson.lesson_id})">Xóa</button>
                        </div>
                    </div>
                `;
                  })
                  .join("")}
                ${contents.length === 0 ? "<p>Chưa có nội dung.</p>" : ""}
            </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem; margin-bottom:1rem;">
                <h3>Bài tập lập trình</h3>
                <button class="btn btn-sm btn-primary" onclick="createExercise(${lesson.lesson_id})">+ Thêm Bài Tập</button>
            </div>
            <div id="exercise-list">
                 ${exercises
                   .map(
                     (e) => `
                    <div class="child-item" style="border-left: 4px solid #3730a3;">
                        <div>
                            <strong>${e.title}</strong> (${e.difficulty}) <br>
                            <small style="color:#666">${e.instruction.substring(0, 80)}...</small>
                        </div>
                        <div style="display:flex;">
                            <button class="btn btn-sm btn-outline" style="margin-right:0.5rem; color: black" onclick="manageTestCases(${e.exercise_id})">Bộ Test</button>
                            <button class="btn btn-sm btn-outline" style="margin-right:0.5rem; color: black" onclick="editExercise(${e.exercise_id}, '${encodeURIComponent(e.title).replace(/'/g, "%27")}', ${lesson.lesson_id})">Sửa</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteItem('exercise', ${e.exercise_id}, ${lesson.lesson_id})">Xóa</button>
                        </div>
                    </div>
                `,
                   )
                   .join("")}
                ${exercises.length === 0 ? "<p>Chưa có bài tập.</p>" : ""}
            </div>
        </div>
    `;
}

function showModal(title, contentHTML, verifyAction) {
  modalTitle.innerText = title;
  modalBody.innerHTML = contentHTML;
  modal.classList.add("open");

  const newSave = modalSave.cloneNode(true);
  modalSave.parentNode.replaceChild(newSave, modalSave);
  modalSave = newSave;
  const freshSave = document.getElementById("modal-save");

  freshSave.onclick = async () => {
    try {
      await verifyAction();
      modal.classList.remove("open");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };
}

function closeModal() {
  modal.classList.remove("open");
}

window.init = () => showDashboard();

window.showDashboard = showDashboard; // Expose

window.createNew = async (type) => {
  if (type === "course") {
    const html = `
            <div class="form-group"><label>Course Name</label><input type="text" id="new-course-name" class="form-control"></div>
            <div class="form-group"><label>Main Language</label><input type="text" id="new-main-lang" class="form-control" placeholder="e.g. JavaScript, Python"></div>
            <div class="form-group"><label>Description</label><textarea id="new-desc" class="form-control"></textarea></div>
            <div class="form-group"><label>Difficulty</label>
                <select id="new-diff" class="form-control">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
        `;
    showModal("New Course", html, async () => {
      const name = document.getElementById("new-course-name").value;
      const lang = document.getElementById("new-main-lang").value;
      const desc = document.getElementById("new-desc").value;
      const diff = document.getElementById("new-diff").value;

      if (!name) throw new Error("Name required");
      if (!lang) throw new Error("Main Language required");

      await api.createCourse({
        course_name: name,
        main_language: lang,
        course_description: desc,
        difficulty_level: diff,
      });
      loadDashboard();
    });
  }
};

window.createChild = async (type, parentId) => {
  if (type === "chapter") {
    const courseIdToUse = currentCourseId;

    showModal(
      "New Chapter",
      `<div class="form-group"><label>Chapter Name</label><input type="text" id="new-chap-name" class="form-control"></div>`,
      async () => {
        const name = document.getElementById("new-chap-name").value;
        if (!name) throw new Error("Name required");
        await api.createChapter({
          course_id: courseIdToUse,
          chapter_name: name,
        });
        loadCourseHierarchy(courseIdToUse);
      },
    );
  } else if (type === "lesson") {
    showModal(
      "New Lesson",
      `<div class="form-group"><label>Lesson Name</label><input type="text" id="new-less-name" class="form-control"></div>`,
      async () => {
        const name = document.getElementById("new-less-name").value;
        if (!name) throw new Error("Name required");
        await api.createLesson({ chapter_id: parentId, lesson_name: name });
        loadCourseHierarchy(currentCourseId); // Refresh tree
      },
    );
  }
};

window.createContent = async (lessonId) => {
  const html = `
        <div class="form-group"><label>Type</label>
            <select id="new-cont-type" class="form-control" onchange="toggleCodeFields(this.value)">
                <option value="theory">Theory</option>
                <option value="code">Code</option>
            </select>
        </div>
        <div class="form-group"><label>Title (Optional)</label><input type="text" id="new-cont-title" class="form-control"></div>
        <div class="form-group"><label>Content Body</label>
            ${getToolbarHTML("new-cont-body")}
            <textarea id="new-cont-body" class="form-control has-toolbar" rows="10"></textarea>
        </div>
        
        <div id="code-fields" style="display:none;">
            <div class="form-group"><label>Language</label>
                <select id="new-cont-lang" class="form-control">
                    <option value="javascript">JavaScript</option>
                    <option value="html">HTML</option>
                    <option value="css">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="sql">C</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group"><label>Code Explanation / Notes</label>
                <textarea id="new-cont-expl" class="form-control" rows="3" placeholder="Explain this code snippet..."></textarea>
            </div>
        </div>
    `;

  const modalContent = document.querySelector(".modal-content");
  if (modalContent) modalContent.classList.add("modal-wide");

  showModal("Add Content", html, async () => {
    const type = document.getElementById("new-cont-type").value;
    const title = document.getElementById("new-cont-title").value;
    const body = document.getElementById("new-cont-body").value;
    const lang = document.getElementById("new-cont-lang").value;
    const expl = document.getElementById("new-cont-expl").value;

    await api.createContent({
      lesson_id: lessonId,
      content_type: type,
      content_title: title,
      body: body || "",
      code_language: type === "code" ? lang : null,
      code_explanation: type === "code" ? expl : null,
    });

    if (modalContent) modalContent.classList.remove("modal-wide"); // Reset
    loadLessonEditor({ lesson_id: lessonId, lesson_name: "Refreshing..." });
  });

  window.toggleCodeFields = (val) => {
    const fields = document.getElementById("code-fields");
    const body = document.getElementById("new-cont-body");
    if (val === "code") {
      fields.style.display = "block";
      body.style.fontFamily = "monospace";
      body.style.background = "#f3f4f6";
    } else {
      fields.style.display = "none";
      body.style.fontFamily = "inherit";
      body.style.background = "#fff";
    }
  };
};

window.createExercise = async (id, parentType, isChapter = false) => {
  const lessonId = isChapter ? null : id;
  const chapterId = isChapter ? id : null;

  const html = `
        <div class="form-group"><label>Ngôn ngữ lập trình</label>
            <select id="new-ex-lang" class="form-control">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="cpp">C++</option>
            </select>
        </div>
        <div class="form-group"><label>Tiêu đề</label><input type="text" id="new-ex-title" class="form-control"></div>
        <div class="form-group"><label>Hướng dẫn</label><textarea id="new-ex-instr" class="form-control" rows="3"></textarea></div>
        <div class="form-group"><label>Code mẫu (Starter)</label><textarea id="new-ex-start" class="form-control" rows="5" style="font-family:monospace; background:#f3f4f6"></textarea></div>
        <div class="form-group"><label>Code giải (Solution)</label><textarea id="new-ex-sol" class="form-control" rows="5" style="font-family:monospace; background:#f0fdf4"></textarea></div>
        <div class="form-group"><label>Độ khó</label>
             <select id="new-ex-diff" class="form-control">
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
            </select>
        </div>
    `;

  const modalContent = document.querySelector(".modal-content");
  if (modalContent) modalContent.classList.add("modal-wide");

  showModal("Thêm Bài Tập Mới", html, async () => {
    const title = document.getElementById("new-ex-title").value;
    const instr = document.getElementById("new-ex-instr").value;
    const start = document.getElementById("new-ex-start").value;
    const diff = document.getElementById("new-ex-diff").value;
    const lang = document.getElementById("new-ex-lang").value;
    const sol = document.getElementById("new-ex-sol").value;

    await api.createExercise({
      lesson_id: lessonId,
      chapter_id: chapterId,
      title: title || "Bài tập chưa đặt tên",
      instruction: instr || "",
      starter_code: start || "",
      solution_code: sol || "",
      programming_language: lang,
      difficulty: diff,
    });

    if (modalContent) modalContent.classList.remove("modal-wide");

    if (isChapter) {
      loadChapterEditor({
        chapter_id: chapterId,
        chapter_name: "Đang tải lại...",
      });
    } else {
      loadLessonEditor({ lesson_id: lessonId, lesson_name: "Đang tải lại..." });
    }
  });
};

window.editExercise = async (id, encodedTitle, parentId, isChapter = false) => {
  try {
    // Fetch full details
    const ex = await api.getExercise(id);

    const html = `
            <div class="form-group"><label>Ngôn ngữ lập trình</label>
                <select id="edit-ex-lang" class="form-control">
                    <option value="javascript" ${ex.programming_language === "javascript" ? "selected" : ""}>JavaScript</option>
                    <option value="python" ${ex.programming_language === "python" ? "selected" : ""}>Python</option>
                    <option value="java" ${ex.programming_language === "java" ? "selected" : ""}>Java</option>
                    <option value="csharp" ${ex.programming_language === "csharp" ? "selected" : ""}>C#</option>
                    <option value="php" ${ex.programming_language === "php" ? "selected" : ""}>PHP</option>
                    <option value="cpp" ${ex.programming_language === "cpp" ? "selected" : ""}>C++</option>
                </select>
            </div>
            <div class="form-group"><label>Tiêu đề</label><input type="text" id="edit-ex-title" class="form-control" value="${ex.title}"></div>
            <div class="form-group"><label>Hướng dẫn</label><textarea id="edit-ex-instr" class="form-control" rows="3">${ex.instruction || ""}</textarea></div>
            <div class="form-group"><label>Code mẫu (Starter)</label><textarea id="edit-ex-start" class="form-control" rows="5" style="font-family:monospace; background:#f3f4f6">${ex.starter_code || ""}</textarea></div>
            <div class="form-group"><label>Code giải (Solution)</label><textarea id="edit-ex-sol" class="form-control" rows="5" style="font-family:monospace; background:#f0fdf4">${ex.solution_code || ""}</textarea></div>
            <div class="form-group"><label>Độ khó</label>
                 <select id="edit-ex-diff" class="form-control">
                    <option value="Easy" ${ex.difficulty === "Easy" ? "selected" : ""}>Dễ</option>
                    <option value="Medium" ${ex.difficulty === "Medium" ? "selected" : ""}>Trung bình</option>
                    <option value="Hard" ${ex.difficulty === "Hard" ? "selected" : ""}>Khó</option>
                </select>
            </div>
        `;

    const modalContent = document.querySelector(".modal-content");
    if (modalContent) modalContent.classList.add("modal-wide");

    showModal("Sửa Bài Tập", html, async () => {
      const title = document.getElementById("edit-ex-title").value;
      const instr = document.getElementById("edit-ex-instr").value;
      const start = document.getElementById("edit-ex-start").value;
      const diff = document.getElementById("edit-ex-diff").value;
      const lang = document.getElementById("edit-ex-lang").value;
      const sol = document.getElementById("edit-ex-sol").value;

      await api.updateExercise(id, {
        title: title,
        instruction: instr,
        starter_code: start,
        solution_code: sol,
        programming_language: lang,
        difficulty: diff,
      });

      if (modalContent) modalContent.classList.remove("modal-wide");
      if (isChapter) {
        alert("Đã cập nhật! Hãy reload lại trang nếu cần thấy thay đổi ngay.");
      } else {
        loadLessonEditor({
          lesson_id: parentId,
          lesson_name: "Đang tải lại...",
        });
      }
    });
  } catch (e) {
    alert("Lỗi tải thông tin bài tập: " + e.message);
  }
};

window.manageTestCases = async (exerciseId) => {
  const showTestCasesModal = async () => {
    const cases = await api.getTestCases(exerciseId);

    let casesHtml = cases
      .map(
        (c) => `
             <div class="child-item" style="border:1px solid #eee; padding:0.5rem; margin-bottom:0.5rem; background:#fff">
                <div style="flex:1">
                    <strong>Input:</strong> <code style="background:#eee; padding:2px">${c.input || "Empty"}</code><br>
                    <strong>Expect:</strong> <code style="background:#eee; padding:2px">${c.expected_output}</code>
                    ${c.is_hidden ? '<span class="badge" style="background:#fee2e2; color:#991b1b">Hidden</span>' : ""}
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteTestCase(${c.test_case_id}, ${exerciseId})">Del</button>
            </div>
        `,
      )
      .join("");

    if (cases.length === 0) casesHtml = "<p>No test cases.</p>";

    const html = `
            <div style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:1rem;">
                <h4>Thêm Test Case Mới</h4>
                <div class="form-group"><label>Input (Đầu vào)</label><textarea id="new-tc-input" class="form-control" rows="2"></textarea></div>
                <div class="form-group"><label>Output Mong Đợi (Đầu ra)</label><textarea id="new-tc-output" class="form-control" rows="2"></textarea></div>
                <div class="form-group">
                    <label><input type="checkbox" id="new-tc-hidden" checked> Ẩn test case này?</label>
                </div>
                <button class="btn btn-sm btn-primary" id="btn-add-tc">+ Thêm Case</button>
            </div>
            <div style="background:#f9fafb; padding:1rem; border-radius:8px;">
            <h4>Danh sách Test Case</h4>
            ${casesHtml}
        </div>
    `;

    showModal("Quản lý Test Cases", html, async () => {
      return true;
    });

    setTimeout(() => {
      const addBtn = document.getElementById("btn-add-tc");
      if (addBtn) {
        addBtn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const input = document.getElementById("new-tc-input").value;
          const output = document.getElementById("new-tc-output").value;
          const hidden = document.getElementById("new-tc-hidden").checked;

          if (!output) {
            alert("Output required");
            return;
          }

          await api.createTestCase({
            exercise_id: exerciseId,
            input: input,
            expected_output: output,
            is_hidden: hidden,
          });
          showTestCasesModal();
        };
      }
    }, 100);
  };
  showTestCasesModal();
};

window.deleteTestCase = async (id, exerciseId) => {
  if (!confirm("Delete case?")) return;
  await api.deleteTestCase(id);
  manageTestCases(exerciseId);
};

const getToolbarHTML = (targetId) => `
    <div class="editor-toolbar">
        <button type="button" class="tb-btn" onclick="insertBold('${targetId}')" title="Bold"><i class="fas fa-bold"></i></button>
        <button type="button" class="tb-btn" onclick="insertItalic('${targetId}')" title="Italic"><i class="fas fa-italic"></i></button>
        <button type="button" class="tb-btn" onclick="insertHeading('${targetId}')" title="Heading 3"><i class="fas fa-heading"></i></button>
        <button type="button" class="tb-btn" onclick="insertList('${targetId}')" title="List"><i class="fas fa-list-ul"></i></button>
        <button type="button" class="tb-btn" onclick="insertQuote('${targetId}')" title="Quote"><i class="fas fa-quote-right"></i></button>
        <button type="button" class="tb-btn" onclick="insertCodeBlock('${targetId}')" title="Code Block"><i class="fas fa-code"></i></button>
    </div>
        `;

window.insertBold = (id) => insertMD(id, "**", "**");
window.insertItalic = (id) => insertMD(id, "*", "*");
window.insertHeading = (id) => insertMD(id, "### ");
window.insertList = (id) => insertMD(id, "- ");
window.insertQuote = (id) => insertMD(id, "\n> ");
window.insertCodeBlock = (id) => insertMD(id, "```\\n", "\\n```");

window.insertMD = (id, start, end = "") => {
  const el = document.getElementById(id);
  if (!el) return;

  const startPos = el.selectionStart;
  const endPos = el.selectionEnd;
  const text = el.value;

  const before = text.substring(0, startPos);
  const selected = text.substring(startPos, endPos);
  const after = text.substring(endPos);

  el.value = before + start + selected + end + after;

  el.selectionStart = startPos + start.length;
  el.selectionEnd = startPos + start.length + selected.length;
  el.focus();
};

window.editContent = (
  id,
  type,
  encodedTitle,
  encodedBody,
  lessonId,
  encodedExpl,
  encodedLang,
) => {
  const title = decodeURIComponent(encodedTitle);
  const body = decodeURIComponent(encodedBody);
  const expl =
    encodedExpl && encodedExpl !== "undefined"
      ? decodeURIComponent(encodedExpl)
      : "";
  const currentLang =
    encodedLang && encodedLang !== "undefined"
      ? decodeURIComponent(encodedLang)
      : "javascript";

  const html = `
        <div class="form-group"><label>Type</label>
            <select id="edit-cont-type" class="form-control" disabled>
                <option value="theory" ${type === "theory" ? "selected" : ""}>Theory</option>
                <option value="code" ${type === "code" ? "selected" : ""}>Code</option>
            </select>
        </div>
        <div class="form-group"><label>Title (Optional)</label><input type="text" id="edit-cont-title" class="form-control" value="${title}"></div>
        
        <div class="form-group"><label>Content Body</label>
            ${getToolbarHTML("edit-cont-body")}
            <textarea id="edit-cont-body" class="form-control has-toolbar" rows="12" style="${type === "code" ? "font-family:monospace; background:#f3f4f6;" : ""}">${body}</textarea>
        </div>
        
        ${
          type === "code"
            ? `
        <div class="form-group"><label>Language</label>
            <select id="edit-cont-lang" class="form-control">
                <option value="javascript" ${currentLang === "javascript" ? "selected" : ""}>JavaScript</option>
                <option value="html" ${currentLang === "html" ? "selected" : ""}>HTML</option>
                <option value="css" ${currentLang === "css" ? "selected" : ""}>C++</option>
                <option value="python" ${currentLang === "python" ? "selected" : ""}>Python</option>
                <option value="java" ${currentLang === "java" ? "selected" : ""}>Java</option>
                <option value="csharp" ${currentLang === "csharp" ? "selected" : ""}>C#</option>
                <option value="sql" ${currentLang === "sql" ? "selected" : ""}>C</option>
                <option value="other" ${currentLang === "other" ? "selected" : ""}>Other</option>
            </select>
        </div>
        <div class="form-group"><label>Code Explanation</label>
            <textarea id="edit-cont-expl" class="form-control" rows="3">${expl}</textarea>
        </div>`
            : ""
        }
    `;

  const modalContent = document.querySelector(".modal-content");
  if (modalContent) modalContent.classList.add("modal-wide");

  showModal("Edit Content", html, async () => {
    const newTitle = document.getElementById("edit-cont-title").value;
    const newBody = document.getElementById("edit-cont-body").value;
    const newExpl =
      type === "code" ? document.getElementById("edit-cont-expl").value : null;
    const newLang =
      type === "code" ? document.getElementById("edit-cont-lang").value : null;

    await api.updateContent(id, {
      content_title: newTitle,
      body: newBody,
      code_language: newLang,
      code_explanation: newExpl,
    });

    if (modalContent) modalContent.classList.remove("modal-wide"); // Reset
    loadLessonEditor({ lesson_id: lessonId, lesson_name: "Refreshing..." });
  });
};

window.deleteItem = async (type, id, parentId) => {
  if (!confirm("Are you sure?")) return;

  if (type === "course") {
    await api.deleteCourse(id);
    loadDashboard();
  } else if (type === "chapter") {
    await api.deleteChapter(id);
    loadCourseHierarchy(currentCourseId);
  } else if (type === "lesson") {
    await api.deleteLesson(id);
    loadCourseHierarchy(currentCourseId);
  } else if (type === "content") {
    await api.deleteContent(id);
    loadLessonEditor({ lesson_id: parentId, lesson_name: "Refreshing..." });
  } else if (type === "exercise") {
    const isChapter = parentId === null || parentId === undefined;

    await api.deleteExercise(id);
    if (parentId) {
      loadLessonEditor({ lesson_id: parentId, lesson_name: "Đang tải lại..." });
    } else {
      alert("Đã xóa bài tập chương thành công!");
    }
  }
};

window.editCourseMeta = (id) =>
  alert("Edit Course Meta: To be implemented fully separate from Dashboard");
window.editItem = (type, id, encodedName) => {
  const currentName =
    encodedName && encodedName !== "undefined"
      ? decodeURIComponent(encodedName)
      : "";

  if (type === "chapter") {
    const html = `<div class="form-group"><label>Tên Chương Mới</label><input type="text" id="edit-chap-name" class="form-control" value="${currentName}"></div>`;

    showModal("Sửa Tên Chương", html, async () => {
      const newName = document.getElementById("edit-chap-name").value;
      if (!newName) throw new Error("Name required");

      await api.updateChapter(id, { chapter_name: newName });

      loadCourseHierarchy(currentCourseId);
      loadChapterEditor({ chapter_id: id, chapter_name: newName });
    });
  } else if (type === "lesson") {
    const newName = prompt("Enter new name:", currentName);
    if (newName) {
      fetch(`/api/lessons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_name: newName }),
      }).then(() => loadCourseHierarchy(currentCourseId));
    }
  }
};
