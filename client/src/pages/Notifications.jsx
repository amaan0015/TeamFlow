
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  RefreshCw,
} from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notificationApi";

import "../App.css";

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleNewNotification = (event) => {
      const notification = event.detail;
      if (!notification?._id) return;

      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }
        return [notification, ...current].slice(0, 50);
      });

      if (!notification.isRead) {
        setUnreadCount((current) => current + 1);
      }
    };

    window.addEventListener("teamflow:notification", handleNewNotification);

    return () => {
      window.removeEventListener(
        "teamflow:notification",
        handleNewNotification
      );
    };
  }, []);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not mark notification as read."
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not mark all as read."
      );
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }

    if (notification.workspace?._id && notification.project?._id) {
      navigate(
        `/workspaces/${notification.workspace._id}/projects/${notification.project._id}/tasks`
      );
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    return true;
  });

  return (
    <main className="notifications-page">
      <header className="notifications-page-header">
        <div className="notifications-page-heading">
          <span className="notifications-page-icon">
            <Bell size={23} />
          </span>

          <div>
            <h1>Notifications</h1>
            <p>Stay updated on your team's activity.</p>
          </div>
        </div>

        <div className="notifications-page-actions">
          <button
            type="button"
            className="notifications-refresh"
            onClick={loadNotifications}
            title="Refresh notifications"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="notifications-mark-all"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </header>

      <section className="notifications-summary">
        <div className="notifications-stat">
          <span>Total notifications</span>
          <strong>{notifications.length}</strong>
        </div>

        <div className="notifications-stat">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="notifications-stat">
          <span>Read</span>
          <strong>{notifications.filter((item) => item.isRead).length}</strong>
        </div>
      </section>

      <section className="notifications-panel">
        <div className="notifications-panel-header">
          <h2>Recent activity</h2>

          <div className="notifications-filters">
            {["all", "unread", "read"].map((value) => (
              <button
                type="button"
                key={value}
                className={
                  filter === value
                    ? "notifications-filter active"
                    : "notifications-filter"
                }
                onClick={() => setFilter(value)}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="notifications-error" role="alert">
            {error}
            <button type="button" onClick={loadNotifications}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <p className="notifications-message">Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty-state">
            <span className="notifications-empty-icon">
              <Bell size={26} />
            </span>
            <h3>
              {filter === "unread"
                ? "You're all caught up"
                : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
            </h3>
            <p>
              {filter === "unread"
                ? "New unread notifications will appear here."
                : "Team activity and updates will appear here."}
            </p>
          </div>
        ) : (
          <div className="notifications-page-list">
            {filteredNotifications.map((notification) => (
              <article
                key={notification._id}
                className={`notifications-row ${
                  notification.isRead ? "is-read" : "is-unread"
                }`}
              >
                <span className="notifications-row-icon">
                  {notification.isRead ? (
                    <Check size={18} />
                  ) : (
                    <Bell size={18} />
                  )}
                </span>

                <button
                  type="button"
                  className="notifications-row-content"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notifications-row-message">
                    {notification.message || "You have a new notification"}
                  </span>

                  <span className="notifications-row-meta">
                    <Clock size={13} />
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : "Recently"}
                    {notification.workspace?.name &&
                      ` · ${notification.workspace.name}`}
                    {notification.project?.name &&
                      ` · ${notification.project.name}`}
                  </span>
                </button>

                {!notification.isRead && (
                  <button
                    type="button"
                    className="notifications-row-read"
                    onClick={() => handleMarkRead(notification._id)}
                    title="Mark as read"
                  >
                    <Check size={16} />
                    <span>Mark read</span>
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
