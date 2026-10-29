
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjects, createProject } from "../lib/projectApi";
import { getProjectActivities } from "../lib/projectActivityApi";

const activityLabels = {
  task_created: "created a task",
  task_updated: "updated a task",
  status_changed: "changed a task's status",
  task_assigned: "changed task assignment",
  task_deleted: "deleted a task",
  comment_added: "added a comment",
};

export default function Projects() {
  const { workspaceId } = useParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [activeProject, setActiveProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");

  const loadProjects = useCallback(async () => {
    setError("");

    try {
      const data = await getProjects(workspaceId);
      setProjects(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load projects."
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const project = await createProject(workspaceId, form);
      setProjects((current) => [project, ...current]);
      setForm({ name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create project."
      );
    } finally {
      setSaving(false);
    }
  };

  const openProjectActivity = async (project) => {
    setActiveProject(project);
    setActivities([]);
    setActivityError("");
    setActivityLoading(true);

    try {
      const data = await getProjectActivities(
        workspaceId,
        project._id
      );
      setActivities(data);
    } catch (err) {
      setActivityError(
        err.response?.data?.message ||
          "Could not load project activity."
      );
    } finally {
      setActivityLoading(false);
    }
  };

  const closeProjectActivity = () => {
    setActiveProject(null);
    setActivities([]);
    setActivityError("");
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="brand">
            TeamFlow
          </Link>
          <p className="muted">Workspace projects</p>
        </div>

        <Link to="/dashboard">← All workspaces</Link>
      </header>

      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAN AND DELIVER</p>
            <h2>Projects</h2>
            <p className="muted">
              Organize your team's work into focused projects.
            </p>
          </div>

          <button onClick={() => setShowForm((current) => !current)}>
            {showForm ? "Cancel" : "+ New project"}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <form className="workspace-form" onSubmit={handleCreate}>
            <h3>Create a project</h3>

            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              minLength={2}
              maxLength={100}
              placeholder="e.g. Website Redesign"
              required
            />

            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              maxLength={1000}
              rows={3}
              placeholder="What should this project achieve?"
            />

            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create project"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">P</div>
            <h3>No projects yet</h3>
            <p>
              Create a project to start organizing tasks and deadlines.
            </p>
            <button onClick={() => setShowForm(true)}>
              Create your first project
            </button>
          </div>
        ) : (
          <div className="workspace-grid">
            {projects.map((project) => (
              <article className="workspace-card" key={project._id}>
                <div className="workspace-icon">
                  {project.name.charAt(0).toUpperCase()}
                </div>

                <h3>{project.name}</h3>
                <p>
                  {project.description || "No description added yet."}
                </p>

                <div className="workspace-meta">
                  <span>
                    {project.status
                      ? project.status.charAt(0).toUpperCase() +
                        project.status.slice(1)
                      : "Planning"}
                  </span>
                  <span>Project</span>
                </div>

                <div className="workspace-actions">
                  <Link
                    to={`/workspaces/${workspaceId}/projects/${project._id}/tasks`}
                  >
                    Open task board →
                  </Link>

                  <button
                    type="button"
                    onClick={() => openProjectActivity(project)}
                  >
                    View activity
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activeProject && (
        <div
          className="activity-overlay"
          onClick={closeProjectActivity}
        >
          <section
            className="activity-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-activity-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="activity-panel-header">
              <div>
                <p className="eyebrow">PROJECT HISTORY</p>
                <h2 id="project-activity-title">
                  {activeProject.name}
                </h2>
                <p className="muted">Recent team activity</p>
              </div>

              <button
                type="button"
                onClick={closeProjectActivity}
                aria-label="Close project activity"
              >
                ✕
              </button>
            </div>

            {activityLoading ? (
              <p className="loading">Loading activity...</p>
            ) : activityError ? (
              <p className="error-message">{activityError}</p>
            ) : activities.length === 0 ? (
              <div className="empty-state">
                <h3>No activity yet</h3>
                <p>
                  Task updates and comments will appear here as your
                  team works on this project.
                </p>
              </div>
            ) : (
              <div className="activity-timeline">
                {activities.map((activity) => (
                  <article
                    className="activity-item"
                    key={activity._id}
                  >
                    <div className="activity-dot" />

                    <div className="activity-content">
                      <p>
                        <strong>
                          {activity.actor?.name || "A team member"}
                        </strong>{" "}
                        {activityLabels[activity.action] ||
                          "performed an action"}
                      </p>

                      {activity.details && (
                        <p className="muted">
                          {activity.details}
                        </p>
                      )}

                      <time
                        dateTime={activity.createdAt}
                        className="activity-time"
                      >
                        {new Date(activity.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

