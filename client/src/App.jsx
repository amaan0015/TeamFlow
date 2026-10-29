
import React, { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import TaskBoard from "./pages/TaskBoard";
import MyTasks from "./pages/MyTasks";
import NotificationBell from "./components/NotificationBell";
import Notifications from "./pages/Notifications";

import socket from "./lib/socket";
import { getWorkspaces } from "./lib/workspaceApi";
import {
  Bell,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";

import "./App.css";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="loading">Loading TeamFlow...</p>;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function SocketManager() {
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("teamflow_token");

    if (!user || !token) {
      socket.disconnect();
      return;
    }

    socket.auth = { token };

    const handleConnect = () => {
      console.info("TeamFlow real-time connection established");
    };

    const handleConnectError = (error) => {
      console.error("TeamFlow socket connection failed:", error.message);
    };

    const handleNewNotification = (notification) => {
      if (!notification?._id) return;

      window.dispatchEvent(
        new CustomEvent("teamflow:notification", {
          detail: notification,
        })
      );
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("notification:new", handleNewNotification);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("notification:new", handleNewNotification);
      socket.disconnect();
    };
  }, [user]);

  return null;
}

function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState("");
  const [projectsExpanded, setProjectsExpanded] = useState(
    location.pathname.startsWith("/workspaces/")
  );

  useEffect(() => {
    let active = true;

    async function loadSidebarWorkspaces() {
      try {
        const data = await getWorkspaces();
        if (active) {
          setWorkspaces(Array.isArray(data) ? data : []);
          setWorkspacesError("");
        }
      } catch (error) {
        if (active) {
          setWorkspacesError(
            error.response?.data?.message || "Couldn't load workspaces."
          );
        }
      } finally {
        if (active) setWorkspacesLoading(false);
      }
    }

    loadSidebarWorkspaces();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/workspaces/")) {
      setProjectsExpanded(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
      end: true,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <>
      <div className="app-sidebar-brand">
        <div className="app-sidebar-logo" aria-hidden="true">
          <FolderKanban size={21} />
        </div>
        {!collapsed && (
          <div className="app-sidebar-brand-copy">
            <span className="app-sidebar-brand-name">TeamFlow</span>
            <span className="app-sidebar-brand-caption">TEAM WORKSPACE</span>
          </div>
        )}
        <button
          className="app-sidebar-mobile-close"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={19} />
        </button>
      </div>

      <div className="app-sidebar-section-label">
        {!collapsed && "WORKSPACE"}
      </div>

      <nav className="app-sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-sidebar-link${isActive ? " active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        <button
          type="button"
          className={`app-sidebar-link app-sidebar-expand-link${
            location.pathname.startsWith("/workspaces/") ? " active" : ""
          }`}
          onClick={() => {
            if (collapsed) setCollapsed(false);
            setProjectsExpanded((value) => !value);
          }}
          aria-expanded={projectsExpanded}
          title={collapsed ? "Projects and workspaces" : undefined}
        >
          <FolderKanban size={19} />
          {!collapsed && <span>Projects & workspaces</span>}
          {!collapsed && (
            <span className={`app-sidebar-chevron${projectsExpanded ? " expanded" : ""}`}>
              ›
            </span>
          )}
        </button>

        {projectsExpanded && !collapsed && (
          <div className="app-sidebar-workspace-list">
            {workspacesLoading ? (
              <p className="app-sidebar-small-message">Loading workspaces…</p>
            ) : workspacesError ? (
              <p className="app-sidebar-small-message">{workspacesError}</p>
            ) : workspaces.length === 0 ? (
              <button
                type="button"
                className="app-sidebar-workspace-item"
                onClick={() => navigate("/dashboard")}
              >
                <span className="app-sidebar-workspace-dot" />
                <span>Create your first workspace</span>
              </button>
            ) : (
              workspaces.map((workspace) => (
                <NavLink
                  key={workspace._id}
                  to={`/workspaces/${workspace._id}/projects`}
                  className={({ isActive }) =>
                    `app-sidebar-workspace-item${isActive ? " active" : ""}`
                  }
                  title={workspace.name}
                >
                  <span className="app-sidebar-workspace-dot">
                    {workspace.name?.charAt(0)?.toUpperCase() || "W"}
                  </span>
                  <span className="app-sidebar-workspace-name">
                    {workspace.name}
                  </span>
                </NavLink>
              ))
            )}
          </div>
        )}

        <button
          type="button"
          className="app-sidebar-link app-sidebar-expand-link"
          onClick={() => navigate("/dashboard")}
          title={collapsed ? "Workspaces" : undefined}
        >
          <Users size={19} />
          {!collapsed && <span>Workspaces</span>}
        </button>

       
<NavLink
  to="/my-tasks"
  className={({ isActive }) =>
    `app-sidebar-link${isActive ? " active" : ""}`
  }
  title={collapsed ? "My Tasks" : undefined}
>
  <CheckSquare size={19} />
  {!collapsed && <span>My Tasks</span>}
</NavLink>

        <NavLink
  to="/notifications"
  className={({ isActive }) =>
    `app-sidebar-link${isActive ? " active" : ""}`
  }
  title={collapsed ? "Notifications" : undefined}
>
  <Bell size={19} />
  {!collapsed && <span>Notifications</span>}
</NavLink>
      </nav>

      <div className="app-sidebar-spacer" />

      <div className="app-sidebar-bottom">
        <div className="app-sidebar-profile">
          <div className="app-sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="app-sidebar-profile-copy">
              <span className="app-sidebar-profile-name">
                {user?.name || "Team member"}
              </span>
              <span className="app-sidebar-profile-email">
                {user?.email || "Signed in"}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="app-sidebar-link app-sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut size={19} />
          {!collapsed && <span>Log out</span>}
        </button>

        <button
          type="button"
          className="app-sidebar-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="app-mobile-menu-button"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={21} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "app-sidebar",
          collapsed ? "collapsed" : "",
          mobileOpen ? "mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

function ProtectedAppLayout() {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-main-content">
  <div className="app-topbar">
    <div className="app-topbar-title">TeamFlow</div>
    <NotificationBell />
  </div>

  <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/workspaces/:workspaceId/projects"
            element={<Projects />}
          />
          <Route
            path="/workspaces/:workspaceId/projects/:projectId/tasks"
            element={<TaskBoard />}
          />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<ProtectedAppLayout />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketManager />
      <AppRoutes />
    </AuthProvider>
  );
}
