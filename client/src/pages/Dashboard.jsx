import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createWorkspace,
  getWorkspaces,
} from "../lib/workspaceApi";
import { addWorkspaceMember } from "../lib/workspaceMemberApi";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notificationApi";
import {
  Bell,
  CheckCheck,
  BriefcaseBusiness,
  ListTodo,
  CircleCheck,
  ChartNoAxesCombined,
  AlertTriangle,
  Users,
} from "lucide-react";
import { getProjects } from "../lib/projectApi";
import { getTasks } from "../lib/taskApi";
import { getProjectActivities } from "../lib/projectActivityApi";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaces, setWorkspaces] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberEmails, setMemberEmails] = useState({});
  const [addingMemberTo, setAddingMemberTo] = useState("");
  const [memberMessages, setMemberMessages] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

const [notifications, setNotifications] = useState([]);
const [recentActivities, setRecentActivities] = useState([]);
const [activitiesLoading, setActivitiesLoading] = useState(true);
const [activitiesError, setActivitiesError] = useState("");
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const [notificationError, setNotificationError] = useState("");

  const loadWorkspaces = useCallback(async () => {
    setError("");

    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load workspaces. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

// Load project statistics
const loadProjectStats = useCallback(async () => {
  setProjectsLoading(true);
  setProjectsError("");

  try {
    const results = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await getProjects(workspace._id);

        const projectResults = await Promise.all(
          projects.map(async (project) => {
            const tasks = await getTasks(workspace._id, project._id);

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(
              (task) => task.status === "done"
            ).length;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueTasks = tasks.filter((task) => {
              if (!task.dueDate || task.status === "done") {
                return false;
              }

              return new Date(task.dueDate) < today;
            }).length;

            
return {
  ...project,
  workspaceId: workspace._id,
  workspaceName: workspace.name,
  totalTasks,
  completedTasks,
  overdueTasks,
  taskStatuses: tasks.map((task) => task.status),
  progress:
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100),
};

          })
        );

        return projectResults;
      })
    );

    setProjectStats(results.flat());
  } catch (err) {
    setProjectsError(
      err.response?.data?.message ||
        "Could not load project progress. Please try again."
    );
  } finally {
    setProjectsLoading(false);
  }
}, [workspaces]);

// Load recent project activity
const loadRecentActivities = useCallback(async () => {
  setActivitiesLoading(true);
  setActivitiesError("");

  try {
    const activityResults = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await getProjects(workspace._id);

        const projectActivities = await Promise.all(
          projects.map(async (project) => {
            const activities = await getProjectActivities(
              workspace._id,
              project._id
            );

            return activities.map((activity) => ({
              ...activity,
              projectName: project.name,
              workspaceName: workspace.name,
              workspaceId: workspace._id,
              projectId: project._id,
            }));
          })
        );

        return projectActivities.flat();
      })
    );

    const sortedActivities = activityResults
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 8);

    setRecentActivities(sortedActivities);
  } catch (err) {
    setActivitiesError(
      err.response?.data?.message ||
        "Could not load recent activity."
    );
  } finally {
    setActivitiesLoading(false);
  }
}, [workspaces]);

// Refresh when the dashboard route changes
useEffect(() => {
  if (!loading) {
    loadProjectStats();
    loadRecentActivities();
  }
}, [
  loading,
  location.key,
  loadProjectStats,
  loadRecentActivities,
]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const workspace = await createWorkspace(form);

      setWorkspaces((current) => [workspace, ...current]);
      setForm({ name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create workspace. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (event, workspaceId) => {
    event.preventDefault();

    const email = (memberEmails[workspaceId] || "").trim();

    if (!email) {
      setMemberMessages((current) => ({
        ...current,
        [workspaceId]: {
          type: "error",
          text: "Enter the registered user's email address.",
        },
      }));
      return;
    }

    setAddingMemberTo(workspaceId);
    setMemberMessages((current) => ({
      ...current,
      [workspaceId]: null,
    }));

    try {
      await addWorkspaceMember(workspaceId, email);

      setMemberEmails((current) => ({
        ...current,
        [workspaceId]: "",
      }));

      setMemberMessages((current) => ({
        ...current,
        [workspaceId]: {
          type: "success",
          text: "Member added successfully!",
        },
      }));

      // Refresh workspace data so the member count updates.
      await loadWorkspaces();
    } catch (err) {
      setMemberMessages((current) => ({
        ...current,
        [workspaceId]: {
          type: "error",
          text:
            err.response?.data?.message ||
            "Could not add member. Please try again.",
        },
      }));
    } finally {
      setAddingMemberTo("");
    }
  };

  const loadNotifications = useCallback(async () => {
  try {
    const data = await getNotifications();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setNotificationError("");
  } catch (err) {
    setNotificationError(
      err.response?.data?.message || "Could not load notifications."
    );
  }
}, []);

useEffect(() => {
  loadNotifications();
}, [loadNotifications]);

const handleMarkRead = async (notificationId) => {
  try {
    await markNotificationRead(notificationId);

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  } catch (err) {
    setNotificationError(
      err.response?.data?.message || "Could not mark notification as read."
    );
  }
};

const handleMarkAllRead = async () => {
  try {
    await markAllNotificationsRead();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );

    setUnreadCount(0);
  } catch (err) {
    setNotificationError(
      err.response?.data?.message || "Could not mark all as read."
    );
  }
};

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };


  

useEffect(() => {
  const handleNewNotification = (event) => {
    const notification = event.detail;

    if (!notification?._id) return;

    setNotifications((previous) => {
      if (previous.some((item) => item._id === notification._id)) {
        return previous;
      }

      return [notification, ...previous].slice(0, 50);
    });

    if (!notification.isRead) {
      setUnreadCount((previous) => previous + 1);
    }
  };

  window.addEventListener(
    "teamflow:notification",
    handleNewNotification
  );

  return () => {
    window.removeEventListener(
      "teamflow:notification",
      handleNewNotification
    );
  };
}, []);


const totalMembers = workspaces.reduce(
  (total, workspace) =>
    total + (workspace.members?.length ?? 0),
  0
);

const totalWorkspaces = workspaces.length;
const unreadNotifications = unreadCount;

const totalTasks = projectStats.reduce(
  (total, project) => total + project.totalTasks,
  0
);

const completedTasks = projectStats.reduce(
  (total, project) => total + project.completedTasks,
  0
);

const overdueTasks = projectStats.reduce(
  (total, project) => total + project.overdueTasks,
  0
);

const overallProgress =
  totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100);

    

    
const taskStatusCounts = projectStats.reduce(
  (counts, project) => {
    project.taskStatuses?.forEach((status) => {
      if (status === "todo") counts.todo++;
      else if (status === "in_progress") counts.inProgress++;
      else if (status === "in_review") counts.inReview++;
      else if (status === "done") counts.done++;
    });

    return counts;
  },
  {
    todo: 0,
    inProgress: 0,
    inReview: 0,
    done: 0,
  }
);




  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>TeamFlow</h1>
          <p className="muted">Your team's work, in one place.</p>
        </div>

        <div className="dashboard-header-actions">
  <div className="notification-wrapper">
    <button
      type="button"
      className="notification-bell"
      aria-label={`Notifications: ${unreadCount} unread`}
      aria-expanded={showNotifications}
      onClick={() => {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next) loadNotifications();
      }}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>

    {showNotifications && (
      <div className="notification-dropdown">
        <div className="notification-dropdown-header">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all"
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}
        </div>

        {notificationError && (
          <p className="error-message">{notificationError}</p>
        )}

        {notifications.length === 0 ? (
          <p className="notification-empty">You're all caught up!</p>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification._id}
                className={`notification-item ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkRead(notification._id);
                  }
                  setShowNotifications(false);
                  if (notification.workspace?._id && notification.project?._id) {
                    navigate(
                      `/workspaces/${notification.workspace._id}/projects/${notification.project._id}/tasks`
                    );
                  }
                }}
              >
                <span className="notification-message">
                  {notification.message}
                </span>
                <span className="notification-date">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </div>

  <button className="secondary-button" onClick={handleLogout}>
    Log out
  </button>
</div>
</header>

      <section className="workspace-section">

        <section className="recent-activity-section">
  <div className="section-heading">
    <div>
      <p className="eyebrow">TEAM UPDATES</p>
      <h2>Recent Activity</h2>
      <p className="muted">
        See the latest changes across your projects.
      </p>
    </div>
  </div>

  {activitiesError && (
    <p className="error-message">{activitiesError}</p>
  )}

  {activitiesLoading ? (
    <p className="loading">Loading recent activity...</p>
  ) : recentActivities.length === 0 ? (
    <div className="empty-state">
      <h3>No activity yet</h3>
      <p>Activity will appear here as your team works on tasks.</p>
    </div>
  ) : (
    <div className="recent-activity-list">
      {recentActivities.map((activity) => (
        <article className="recent-activity-item" key={activity._id}>
          <div className="activity-avatar">
            {activity.actor?.name?.charAt(0).toUpperCase() || "T"}
          </div>

          <div className="activity-content">
            <p>
              <strong>
                {activity.actor?.name || "A team member"}
              </strong>{" "}
              {activity.details || activity.action?.replaceAll("_", " ")}
            </p>

            <div className="activity-meta">
              <span>
                {activity.projectName} · {activity.workspaceName}
              </span>
              <time dateTime={activity.createdAt}>
                {new Date(activity.createdAt).toLocaleString()}
              </time>
            </div>
          </div>

          <Link
            className="activity-open-link"
            to={`/workspaces/${activity.workspaceId}/projects/${activity.projectId}/tasks`}
          >
            Open
          </Link>
        </article>
      ))}
    </div>
  )}
</section>

        <section className="project-overview">
  <div className="section-heading">
    <div>
      <p className="eyebrow">PROJECT TRACKER</p>
      <h2>Project Overview</h2>
      <p className="muted">
        Track progress and see what your team needs to finish.
      </p>
    </div>
  </div>

  {projectsError && (
    <p className="error-message">{projectsError}</p>
  )}

  {projectsLoading ? (
    <p className="loading">Loading project progress...</p>
  ) : projectStats.length === 0 ? (
    <div className="empty-state">
      <h3>No projects yet</h3>
      <p>Create a project inside a workspace to see its progress here.</p>
    </div>
  ) : (
    <div className="project-overview-grid">
      {projectStats.map((project) => (
        <article className="project-overview-card" key={project._id}>
          <div className="project-overview-card-top">
            <div className="workspace-icon">
              {project.name?.charAt(0).toUpperCase() || "P"}
            </div>
            
       <span
        className={`project-status status-${String(
          project.status || "planning"
          )
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
        >
        {project.status
        ? project.status.replaceAll("_", " ")
        : "Planning"}
        </span>

          </div>

          <p className="project-workspace-name">
            {project.workspaceName}
          </p>

          <h3>{project.name}</h3>

          <p className="project-overview-description">
            {project.description || "No project description added yet."}
          </p>

          <div className="project-progress-heading">
            <span>Completion</span>
            <strong>{project.progress}%</strong>
          </div>

          <div
            className="project-progress-track"
            role="progressbar"
            aria-label={`${project.name} completion`}
            aria-valuenow={project.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="project-progress-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>

          <div className="project-overview-stats">
            <span>
              <strong>{project.completedTasks}</strong> / {project.totalTasks} tasks done
            </span>
            <span className={project.overdueTasks > 0 ? "overdue-text" : ""}>
              {project.overdueTasks} overdue
            </span>
          </div>

          <Link
            className="project-board-link"
            to={`/workspaces/${project.workspaceId}/projects/${project._id}/tasks`}
          >
            Open task board →
          </Link>
        </article>
      ))}
    </div>
  )}
</section>
      
<section className="dashboard-overview">
  <div className="overview-heading">
    <p className="eyebrow">TEAM WORKSPACE</p>
    <h2>Welcome back, {user?.name || "there"} 👋</h2>
    <p className="overview-description">
      Here's a quick overview of your team's workspace.
    </p>
  </div>

  
<div className="task-stats dashboard-stat-cards">
  <article className="task-stat-card stat-blue">
    <div className="stat-icon">
      <BriefcaseBusiness size={23} />
    </div>
    <p>Total workspaces</p>
    <h3>{totalWorkspaces}</h3>
    <span>Workspaces you can access</span>
  </article>

  <article className="task-stat-card stat-purple">
    <div className="stat-icon">
      <ListTodo size={23} />
    </div>
    <p>Total tasks</p>
    <h3>{totalTasks}</h3>
    <span>Across your projects</span>
  </article>

  <article className="task-stat-card stat-green">
    <div className="stat-icon">
      <CircleCheck size={23} />
    </div>
    <p>Completed tasks</p>
    <h3>{completedTasks}</h3>
    <span>
      {totalTasks === 0
        ? "No tasks yet"
        : `${Math.round((completedTasks / totalTasks) * 100)}% of all tasks`}
    </span>
  </article>

  <article className="task-stat-card stat-indigo">
    <div className="stat-icon">
      <ChartNoAxesCombined size={23} />
    </div>
    <p>Overall progress</p>
    <h3>{overallProgress}%</h3>
    <span>
      {completedTasks} of {totalTasks} tasks completed
    </span>
  </article>

  <article className="task-stat-card stat-red">
    <div className="stat-icon">
      <AlertTriangle size={23} />
    </div>
    <p>Overdue tasks</p>
    <h3>{overdueTasks}</h3>
    <span>Unfinished tasks past their due date</span>
  </article>

  <article className="task-stat-card stat-orange">
    <div className="stat-icon">
      <Users size={23} />
    </div>
    <p>Team members</p>
    <h3>{totalMembers}</h3>
    <span>Across your workspaces</span>
  </article>
</div>

</section>


        <section className="task-status-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TASK BREAKDOWN</p>
              <h2>Tasks by Status</h2>
              <p className="muted">See where your team's work stands.</p>
            </div>
          </div>

          <div className="task-status-list">
            {[
              { label: "To Do", count: taskStatusCounts.todo, color: "todo" },
              {
                label: "In Progress",
                count: taskStatusCounts.inProgress,
                color: "progress",
              },
              {
                label: "In Review",
                count: taskStatusCounts.inReview,
                color: "review",
              },
              { label: "Done", count: taskStatusCounts.done, color: "done" },
            ].map((item) => {
              const percentage =
                totalTasks === 0
                  ? 0
                  : Math.round((item.count / totalTasks) * 100);

              return (
                <div className="task-status-row" key={item.color}>
                  <div className="task-status-label">
                    <span className={`task-status-dot ${item.color}`} />
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                    <span className="task-status-percentage">
                      {percentage}%
                    </span>
                  </div>

                  <div
                    className="task-status-track"
                    role="progressbar"
                    aria-label={`${item.label} tasks`}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`task-status-fill ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR ORGANIZATION</p>
            <h2>Workspaces</h2>
            <p className="muted">
              Welcome, {user?.name}. Organize your work with your team.
            </p>
          </div>

          <button onClick={() => setShowForm((current) => !current)}>
            {showForm ? "Cancel" : "+ New workspace"}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <form className="workspace-form" onSubmit={handleCreate}>
            <h3>Create a workspace</h3>

            <label htmlFor="workspace-name">Workspace name</label>
            <input
              id="workspace-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              minLength={2}
              maxLength={80}
              placeholder="e.g. Product Team"
              required
            />

            <label htmlFor="workspace-description">
              Description (optional)
            </label>
            <textarea
              id="workspace-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              maxLength={500}
              rows={3}
              placeholder="What will this team work on?"
            />

            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create workspace"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="loading">Loading your workspaces...</p>
        ) : workspaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">TF</div>
            <h3>Your work starts here</h3>
            <p>
              Create your first workspace to bring projects and teammates
              together.
            </p>
            <button onClick={() => setShowForm(true)}>
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="workspace-grid">
            {workspaces.map((workspace) => (
              <article className="workspace-card" key={workspace._id}>
                <div className="workspace-icon">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>

                <h3>{workspace.name}</h3>
                <p>{workspace.description || "No description added yet."}</p>

                <div className="workspace-meta">
  <span>
    {workspace.members?.length ?? 1} member
    {(workspace.members?.length ?? 1) === 1 ? "" : "s"}
  </span>
  <span>Workspace</span>
</div>

<div className="workspace-member-roles">
  <h4>Workspace roles</h4>

  {workspace.members?.map((member) => (
    <div className="workspace-member-role" key={member.user?._id || member.user}>
      <div>
        <strong>{member.user?.name || "Workspace member"}</strong>
        <p className="muted">{member.user?.email || ""}</p>
      </div>

      <span className={`role-badge role-${member.role}`}>
        {member.role
          ? member.role.charAt(0).toUpperCase() + member.role.slice(1)
          : "Member"}
      </span>
    </div>
  ))}
</div>

                <form
                  className="workspace-form member-form"
                  onSubmit={(event) =>
                    handleAddMember(event, workspace._id)
                  }
                >
                  <h4>Add a member</h4>
                  <label htmlFor={`member-email-${workspace._id}`}>
                    Registered user's email
                  </label>
                  <input
                    id={`member-email-${workspace._id}`}
                    type="email"
                    value={memberEmails[workspace._id] || ""}
                    onChange={(event) =>
                      setMemberEmails((current) => ({
                        ...current,
                        [workspace._id]: event.target.value,
                      }))
                    }
                    placeholder="teammate@example.com"
                    maxLength={254}
                    required
                  />

                  <button
                    type="submit"
                    disabled={addingMemberTo === workspace._id}
                  >
                    {addingMemberTo === workspace._id
                      ? "Adding..."
                      : "Add member"}
                  </button>

                  {memberMessages[workspace._id] && (
                    <p
                      className={
                        memberMessages[workspace._id].type === "success"
                          ? "success-message"
                          : "error-message"
                      }
                      role="status"
                    >
                      {memberMessages[workspace._id].text}
                    </p>
                  )}
                </form>

                <div className="workspace-actions">
                  <Link
                    to={`/workspaces/${workspace._id}/projects`}
                    aria-label={`View projects in ${workspace.name}`}
                  >
                    View projects →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
