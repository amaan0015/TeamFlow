import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DragDropContext,
  Draggable,
  Droppable,
} from "@hello-pangea/dnd";
import { getWorkspaceMembers } from "../lib/memberApi";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../lib/taskApi";
import {
  getTaskComments,
  createTaskComment,
} from "../lib/commentApi";

import { getTaskActivities } from "../lib/activityApi";
import "./TaskBoard.css";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "in_review", title: "In Review" },
  { id: "done", title: "Done" },
];

const priorities = ["low", "medium", "high", "urgent"];

export default function TaskBoard() {
  const { workspaceId, projectId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState("");

  const [activeTask, setActiveTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSaving, setCommentsSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [activePanel, setActivePanel] = useState("");
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignee: "",
  });

  const loadTasks = useCallback(async () => {
    setError("");

    try {
      const data = await getTasks(workspaceId, projectId);
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setMembersLoading(true);

      try {
        const data = await getWorkspaceMembers(workspaceId);
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load workspace members."
          );
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const filteredTasks = tasks.filter((task) => {
  const query = searchQuery.trim().toLowerCase();

  const matchesSearch =
    !query ||
    task.title?.toLowerCase().includes(query) ||
    task.description?.toLowerCase().includes(query);

  const matchesPriority =
    priorityFilter === "all" ||
    task.priority === priorityFilter;

  const matchesAssignee =
  assigneeFilter === "all" ||
  (assigneeFilter === "unassigned"
    ? !task.assignee
    : (typeof task.assignee === "object"
        ? task.assignee?._id === assigneeFilter
        : task.assignee === assigneeFilter));

  const matchesStatus =
    statusFilter === "all" || task.status === statusFilter;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  const matchesOverdue = !overdueOnly || isOverdue;

  return (
    matchesSearch &&
    matchesPriority &&
    matchesAssignee &&
    matchesStatus &&
    matchesOverdue
  );
});


  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      return (
        (priorityOrder[b.priority] || 0) -
        (priorityOrder[a.priority] || 0)
      );
    }

    if (sortBy === "dueDate") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    }

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

const totalTasks = tasks.length;

const completedTasks = tasks.filter(
  (task) => task.status === "done"
).length;

const completionRate =
  totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100);

const overdueTasks = tasks.filter((task) => {
  if (!task.dueDate || task.status === "done") {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}).length;



const clearFilters = () => {
  setSearchQuery("");
  setPriorityFilter("all");
  setAssigneeFilter("all");
  setStatusFilter("all");
  setOverdueOnly(false);
  setSortBy("newest");
};

  const openComments = async (task) => {
    setActiveTask(task);
    setActivePanel("comments");
    setComments([]);
    setCommentText("");
    setCommentsError("");
    setCommentsLoading(true);

    try {
      const data = await getTaskComments(
        workspaceId,
        projectId,
        task._id
      );
      setComments(data);
    } catch (err) {
      setCommentsError(
        err.response?.data?.message || "Could not load comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();

    const text = commentText.trim();
    if (!text || !activeTask || commentsSaving) return;

    setCommentsSaving(true);
    setCommentsError("");

    try {
      const comment = await createTaskComment(
        workspaceId,
        projectId,
        activeTask._id,
        text
      );
      setComments((current) => [...current, comment]);
      setCommentText("");
    } catch (err) {
      setCommentsError(
        err.response?.data?.message || "Could not post comment."
      );
    } finally {
      setCommentsSaving(false);
    }
  };

  const openActivityHistory = async (task) => {
  setActiveTask(task);
  setActivePanel("activity");
  setActivities([]);
  setActivitiesError("");
  setActivitiesLoading(true);

  try {
    const data = await getTaskActivities(
      workspaceId,
      projectId,
      task._id
    );

    setActivities(data);
  } catch (err) {
    setActivitiesError(
      err.response?.data?.message || "Could not load activity history."
    );
  } finally {
    setActivitiesLoading(false);
  }
};

  const openEditForm = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignee:
        typeof task.assignee === "object" && task.assignee
          ? task.assignee._id
          : task.assignee || "",
    });
    setShowForm(true);
    setError("");
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const taskData = {
        ...form,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
      };

      if (editingTask) {
        const updatedTask = await updateTask(
          workspaceId,
          projectId,
          editingTask._id,
          taskData
        );
        setTasks((current) =>
          current.map((task) =>
            task._id === editingTask._id ? updatedTask : task
          )
        );
      } else {
        const newTask = await createTask(workspaceId, projectId, taskData);
        setTasks((current) => [newTask, ...current]);
      }

      setForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignee: "",
      });
      setEditingTask(null);
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingTask ? "Could not update task." : "Could not create task.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );
    if (!confirmed || deletingTaskId) return;

    setDeletingTaskId(task._id);
    setError("");

    try {
      await deleteTask(workspaceId, projectId, task._id);
      setTasks((current) => current.filter((item) => item._id !== task._id));
      if (activeTask?._id === task._id) {
        setActiveTask(null);
        setComments([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task.");
    } finally {
      setDeletingTaskId("");
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((item) => item._id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((item) =>
        item._id === draggableId ? { ...item, status: newStatus } : item
      )
    );
    setError("");

    if (task.status === newStatus) return;

    try {
      const updatedTask = await updateTask(
        workspaceId,
        projectId,
        draggableId,
        { status: newStatus }
      );

      setTasks((current) =>
        current.map((item) =>
          item._id === draggableId ? updatedTask : item
        )
      );
    } catch (err) {
      setTasks(previousTasks);
      setError(
        err.response?.data?.message ||
          "Could not move task. Your changes were reverted."
      );
    }
  };


  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="brand">
            TeamFlow
          </Link>
          <p className="muted">Project task board</p>
        </div>

        <Link to={`/workspaces/${workspaceId}/projects`}>
          {"← Back to projects"}
        </Link>
      </header>

      <section className="board-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAN - TRACK - DELIVER</p>
            <h2>Task board</h2>
            <p className="muted">
              Drag tasks between columns to update their status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setEditingTask(null);
              setForm({ title: "", description: "", priority: "medium", dueDate: "", assignee: "" });
            }}
          >
            {showForm ? "Cancel" : "+ New task"}
          </button>
        </div>


        
<div className="task-stats">
  <div className="task-stat-card">
    <p>Total Tasks</p>
    <h3>{totalTasks}</h3>
  </div>

  <div className="task-stat-card">
    <p>Completed Tasks</p>
    <h3>{completedTasks}</h3>
  </div>

  <div className="task-stat-card">
    <p>Completion Rate</p>
    <h3>{completionRate}%</h3>
  </div>

  <div className="task-stat-card">
    <p>Overdue Tasks</p>
    <h3>{overdueTasks}</h3>
  </div>
</div>


        {error && <p className="error-message">{error}</p>}

        
<div className="task-filters" role="search" aria-label="Filter tasks">
  <div className="task-filter-search">
    <span className="task-filter-search-icon" aria-hidden="true">⌕</span>
    <input
      type="search"
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      placeholder="Search tasks..."
      aria-label="Search tasks"
    />
  </div>

  <div className="task-filter-controls">
    <label className="task-filter-field">
      <span>Sort by</span>
      <select
        value={sortBy}
        onChange={(event) => setSortBy(event.target.value)}
        aria-label="Sort tasks"
      >
        <option value="newest">Newest first</option>
        <option value="dueDate">Earliest due date</option>
        <option value="priority">Highest priority</option>
      </select>
    </label>

    <label className="task-filter-field">
      <span>Status</span>
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.title}
          </option>
        ))}
      </select>
    </label>

    <label className="task-filter-field">
      <span>Priority</span>
      <select
        value={priorityFilter}
        onChange={(event) => setPriorityFilter(event.target.value)}
        aria-label="Filter by priority"
      >
        <option value="all">All priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </option>
        ))}
      </select>
    </label>

    <label className="task-filter-field">
      <span>Assignee</span>
      <select
        value={assigneeFilter}
        onChange={(event) => setAssigneeFilter(event.target.value)}
        aria-label="Filter by assignee"
        disabled={membersLoading}
      >
        <option value="all">All members</option>
        <option value="unassigned">Unassigned</option>
        {members.map((member) => (
          <option key={member._id} value={member._id}>
            {member.name}
          </option>
        ))}
      </select>
    </label>
  </div>

  <div className="task-filter-actions">
    <label className="overdue-filter">
      <input
        type="checkbox"
        checked={overdueOnly}
        onChange={(event) => setOverdueOnly(event.target.checked)}
      />
      <span className="overdue-filter-check" aria-hidden="true" />
      <span>Overdue only</span>
    </label>

    <button type="button" className="task-clear-filters" onClick={clearFilters}>
      Clear filters
    </button>
  </div>
</div>


        {showForm && (
          <form className="workspace-form" onSubmit={handleSaveTask}>
            <h3>{editingTask ? "Edit task" : "Create a task"}</h3>

            <label htmlFor="task-title">Task title</label>
            <input
              id="task-title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              minLength={2}
              maxLength={160}
              placeholder="e.g. Build dashboard"
              required
            />

            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              maxLength={3000}
              rows={3}
              placeholder="Describe the task..."
            />

            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>

            <label htmlFor="task-assignee">Assign to (optional)</label>
            <select
              id="task-assignee"
              value={form.assignee}
              onChange={(event) =>
                setForm({ ...form, assignee: event.target.value })
              }
              disabled={membersLoading}
            >
              <option value="">
                {membersLoading ? "Loading members..." : "Unassigned"}
              </option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>

            <label htmlFor="task-due-date">Due date (optional)</label>
            <input
              id="task-due-date"
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm({ ...form, dueDate: event.target.value })
              }
            />

            <button type="submit" disabled={saving}>
              {saving ? (editingTask ? "Saving..." : "Creating...") : (editingTask ? "Save changes" : "Create task")}
            </button>
          </form>
        )}

        {loading ? (
          <p className="loading">Loading tasks...</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {columns.map((column) => {
                const columnTasks = sortedTasks.filter((task) => task.status === column.id);

                return (
                  <Droppable droppableId={column.id} key={column.id}>
                    {(provided, snapshot) => (
                      <section
                        className={`kanban-column ${
                          snapshot.isDraggingOver ? "drag-over" : ""
                        }`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <header className="kanban-column-header">
                          <h3>{column.title}</h3>
                          <span>{columnTasks.length}</span>
                        </header>

                        {columnTasks.length === 0 && (
                          <p className="column-empty">Drop a task here</p>
                        )}

                        {columnTasks.map((task, index) => (
                          <Draggable
                            draggableId={task._id}
                            index={index}
                            key={task._id}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <article
                                className={`task-card ${
                                  dragSnapshot.isDragging
                                    ? "task-card-dragging"
                                    : ""
                                }`}
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                              >
                                <span
                                  className={`priority priority-${task.priority}`}
                                >
                                  {task.priority}
                                </span>

                                <h4>{task.title}</h4>

                                {task.description && (
                                  <p>{task.description}</p>
                                )}

                                {task.assignee && (
                                  <div className="task-assignee">
                                    <span className="assignee-avatar">
                                      {task.assignee.name
                                        ?.charAt(0)
                                        .toUpperCase() || "?"}
                                    </span>
                                    <div className="assignee-details">
                                      <span className="assignee-label">
                                        Assigned to
                                      </span>
                                      <span className="assignee-name">
                                        {task.assignee.name ||
                                          task.assignee.email}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {task.dueDate && (
                                  <p className="task-due-date">
                                    Due:{" "}
                                    {new Date(
                                      task.dueDate
                                    ).toLocaleDateString()}
                                  </p>
                                )}

                               <div className="task-card-actions">
                               <span
                               className="drag-hint"
                               {...dragProvided.dragHandleProps}
                               >
                               Drag to move
                               </span>

                                  <div className="task-management-actions">
                                    <button
                                      type="button"
                                      className="task-edit-button"
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onClick={() => openEditForm(task)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="task-delete-button"
                                      disabled={deletingTaskId === task._id}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onClick={() => handleDeleteTask(task)}
                                    >
                                      {deletingTaskId === task._id ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    className="task-comments-button"
                                    onMouseDown={(event) =>
                                      event.stopPropagation()
                                    }
                                    onClick={() => openComments(task)}
                                  >
                                    Comments
                                  </button>

                                    <button
                                    type="button"
                                    className="task-comments-button"
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => openActivityHistory(task)}
                                    >
                                      Activity
                                    </button>

                                </div>
                              </article>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}
                      </section>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {activeTask && (
          <div className="comments-overlay">
            <section
              className="comments-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="comments-title"
            >
              <header className="comments-header">
                <div>
                  <h2 id="comments-title">
                    {activePanel === "activity" ? "Activity History" : "Task comments"}
                  </h2>
                  <p>{activeTask.title}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTask(null);
                    setActivePanel("");
                  }}
                  aria-label="Close panel"
                >
                  ×
                </button>
              </header>

              {activePanel === "activity" ? (
                <>
                  {activitiesError && (
                    <p className="error-message">{activitiesError}</p>
                  )}

                  <div className="comments-list">
                    {activitiesLoading ? (
                      <p>Loading activity history...</p>
                    ) : activities.length === 0 && !activitiesError ? (
                      <p className="muted">No activity recorded for this task yet.</p>
                    ) : (
                      activities.map((activity) => (
                        <article className="comment-item" key={activity._id}>
                          <div className="comment-author">
                            <span className="assignee-avatar">
                              {activity.actor?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <div>
                              <strong>{activity.actor?.name || "Workspace member"}</strong>
                              <small>
                                {new Date(activity.createdAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                          <p className="comment-text">
                            {activity.details || activity.action.replaceAll("_", " ")}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {commentsError && (
                    <p className="error-message">{commentsError}</p>
                  )}

                  <div className="comments-list">
                    {commentsLoading ? (
                      <p>Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="muted">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <article className="comment-item" key={comment._id}>
                          <div className="comment-author">
                            <span className="assignee-avatar">
                              {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <div>
                              <strong>{comment.author?.name || "Workspace member"}</strong>
                              <small>
                                {new Date(comment.createdAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                        </article>
                      ))
                    )}
                  </div>

                  <form className="comment-form" onSubmit={handleCreateComment}>
                    <label htmlFor="new-comment">Write a comment</label>
                    <textarea
                      id="new-comment"
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Share an update with your team..."
                      maxLength={2000}
                      rows={3}
                      required
                    />
                    <button
                      type="submit"
                      disabled={commentsSaving || !commentText.trim()}
                    >
                      {commentsSaving ? "Posting..." : "Post comment"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
