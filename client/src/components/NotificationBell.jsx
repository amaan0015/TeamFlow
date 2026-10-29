
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/notificationApi";

export default function NotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

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
          item._id === notificationId ? { ...item, isRead: true } : item
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
        current.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Could not mark all as read."
      );
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }

    setShowNotifications(false);

    if (notification.workspace?._id && notification.project?._id) {
      navigate(
        `/workspaces/${notification.workspace._id}/projects/${notification.project._id}/tasks`
      );
    }
  };

  return (
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
                  onClick={() => handleNotificationClick(notification)}
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
  );
}
