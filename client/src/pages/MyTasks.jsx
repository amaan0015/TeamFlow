
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  ListTodo,
  Search,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getWorkspaces } from "../lib/workspaceApi";
import { getProjects } from "../lib/projectApi";
import { getTasks } from "../lib/taskApi";

const STATUSES = [
  { value: "all", label: "All tasks" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Completed" },
];

const PRIORITIES = ["all", "urgent", "high", "medium", "low"];

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function formatStatus(status) {
  const labels = {
    todo: "To do",
    in_progress: "In progress",
    in_review: "In review",
    done: "Completed",
  };
  return labels[status] || "To do";
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;

  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;

  dueDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyTasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const loadMyTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const workspaces = await getWorkspaces();

      const workspaceTaskGroups = await Promise.all(
        workspaces.map(async (workspace) => {
          const projects = await getProjects(workspace._id);

          const projectTaskGroups = await Promise.all(
            projects.map(async (project) => {
              const projectTasks = await getTasks(
                workspace._id,
                project._id
              );

              return projectTasks.map((task) => ({
                ...task,
                workspaceId: workspace._id,
                workspaceName: workspace.name,
                projectId: project._id,
                projectName: project.name,
              }));
            })
          );

          return projectTaskGroups.flat();
        })
      );

      const currentUserId = getId(user?._id || user?.id);

      const assignedTasks = workspaceTaskGroups
        .flat()
        .filter((task) => getId(task.assignee) === currentUserId);

      setTasks(assignedTasks);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load your tasks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyTasks();
  }, [loadMyTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const searchableText = [
          task.title,
          task.description,
          task.projectName,
          task.workspaceName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);
        const matchesStatus =
          statusFilter === "all" || task.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" ||
          task.priority === priorityFilter;
        const matchesOverdue = !overdueOnly || isOverdue(task);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesOverdue
        );
      })
      .sort((a, b) => {
        const aDue = a.dueDate
          ? new Date(a.dueDate).getTime()
          : Infinity;
        const bDue = b.dueDate
          ? new Date(b.dueDate).getTime()
          : Infinity;

        return aDue - bDue;
      });
  }, [tasks, search, statusFilter, priorityFilter, overdueOnly]);

  const completedCount = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const overdueCount = tasks.filter(isOverdue).length;

  const activeCount = tasks.filter(
    (task) => task.status !== "done"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setOverdueOnly(false);
  };

  return (
    <main className="my-tasks-page">
      <header className="my-tasks-header">
        <div>
          <p className="my-tasks-eyebrow">PERSONAL WORKSPACE</p>
          <h1>My Tasks</h1>
          <p className="my-tasks-subtitle">
            All tasks assigned to you across your workspaces.
          </p>
        </div>

        <button
          type="button"
          className="my-tasks-refresh-button"
          onClick={loadMyTasks}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh tasks"}
        </button>
      </header>

      <section className="my-tasks-stats">
        <article className="my-tasks-stat-card">
          <span className="my-tasks-stat-icon blue">
            <ListTodo size={20} />
          </span>
          <div>
            <p>Total assigned</p>
            <strong>{tasks.length}</strong>
          </div>
        </article>

        <article className="my-tasks-stat-card">
          <span className="my-tasks-stat-icon purple">
            <Clock3 size={20} />
          </span>
          <div>
            <p>Still in progress</p>
            <strong>{activeCount}</strong>
          </div>
        </article>

        <article className="my-tasks-stat-card">
          <span className="my-tasks-stat-icon green">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p>Completed</p>
            <strong>{completedCount}</strong>
          </div>
        </article>

        <article className="my-tasks-stat-card">
          <span className="my-tasks-stat-icon red">
            <CalendarDays size={20} />
          </span>
          <div>
            <p>Overdue</p>
            <strong>{overdueCount}</strong>
          </div>
        </article>
      </section>

      <section className="my-tasks-panel">
        <div className="my-tasks-toolbar">
          <div className="my-tasks-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, projects, workspaces..."
              aria-label="Search your tasks"
            />
          </div>

          <label className="my-tasks-select-label">
            <Filter size={16} />
            <span className="sr-only">Priority filter</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              aria-label="Filter by priority"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === "all"
                    ? "All priorities"
                    : `${priority[0].toUpperCase()}${priority.slice(1)} priority`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="my-tasks-status-tabs">
          {STATUSES.map((status) => (
            <button
              type="button"
              key={status.value}
              className={
                statusFilter === status.value ? "active" : ""
              }
              onClick={() => setStatusFilter(status.value)}
            >
              {status.label}
              {status.value === "all" && (
                <span className="my-tasks-tab-count">
                  {tasks.length}
                </span>
              )}
            </button>
          ))}

          <label className="my-tasks-overdue-toggle">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(event) =>
                setOverdueOnly(event.target.checked)
              }
            />
            Overdue only
          </label>
        </div>

        {error && (
          <div className="my-tasks-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadMyTasks}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="my-tasks-state">
            <span className="my-tasks-spinner" />
            <p>Loading your assigned tasks...</p>
          </div>
        ) : !error && filteredTasks.length === 0 ? (
          <div className="my-tasks-state">
            <div className="my-tasks-empty-icon">
              <Circle size={28} />
            </div>
            <h2>
              {tasks.length === 0
                ? "No tasks assigned to you yet"
                : "No matching tasks"}
            </h2>
            <p>
              {tasks.length === 0
                ? "Tasks assigned to your account will appear here."
                : "Try changing your search or filters."}
            </p>

            {tasks.length > 0 && (
              <button
                type="button"
                className="my-tasks-clear-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="my-tasks-list">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task);

              return (
                <article className="my-task-card" key={task._id}>
                  <div
                    className={`my-task-status-mark status-${task.status || "todo"}`}
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </div>

                  <div className="my-task-main">
                    <div className="my-task-title-row">
                      <h3>{task.title}</h3>
                      <span
                        className={`my-task-priority priority-${task.priority || "medium"}`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </div>

                    {task.description && (
                      <p className="my-task-description">
                        {task.description}
                      </p>
                    )}

                    <div className="my-task-meta">
                      <span>{task.workspaceName}</span>
                      <span className="my-task-meta-dot">·</span>
                      <span>{task.projectName}</span>
                      <span className="my-task-meta-dot">·</span>
                      <span
                        className={`my-task-status-text status-text-${task.status || "todo"}`}
                      >
                        {formatStatus(task.status)}
                      </span>
                    </div>

                    <div
                      className={`my-task-due-date${overdue ? " overdue" : ""}`}
                    >
                      <CalendarDays size={14} />
                      <span>
                        {overdue ? "Overdue · " : "Due · "}
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <Link
                    className="my-task-open-link"
                    to={`/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks`}
                    aria-label={`Open task board for ${task.title}`}
                  >
                    <span>Open board</span>
                    <SquareArrowOutUpRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredTasks.length > 0 && (
          <footer className="my-tasks-footer">
            Showing {filteredTasks.length} of {tasks.length} assigned tasks
          </footer>
        )}
      </section>
    </main>
  );
}
