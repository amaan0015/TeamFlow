


import mongoose from "mongoose";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { recordTaskActivity } from "./activityController.js";

const validStatuses = ["todo", "in_progress", "in_review", "done"];
const validPriorities = ["low", "medium", "high", "urgent"];

// Create a notification without breaking a successful task operation.
const createNotificationSafely = async (notificationData, io) => {
  try {
    const notification = await Notification.create(notificationData);

    const populatedNotification = await Notification.findById(notification._id)
      .populate("actor", "name email")
      .populate("workspace", "name")
      .populate("project", "name")
      .populate("task", "title")
      .lean();

    if (io) {
      const recipientRoom = `user:${notificationData.recipient}`;



io.to(recipientRoom).emit("notification:new", notification);


    }

    console.log(
      "Task notification created for recipient:",
      notificationData.recipient.toString()
    );
  } catch (error) {
    console.error("Notification creation error:", error);
  }
};

// GET /api/workspaces/:workspaceId/projects/:projectId/tasks
export const getTasks = async (req, res) => {
  try {
    const { workspaceId, projectId } = req.params;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(projectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or project ID",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const membership = await Workspace.exists({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace",
      });
    }

    const tasks = await Task.find({
      project: projectId,
      workspace: workspaceId,
    })
      .populate("assignee", "name email")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};

// POST /api/workspaces/:workspaceId/projects/:projectId/tasks
export const createTask = async (req, res) => {
  try {
    const { workspaceId, projectId } = req.params;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(projectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace or project ID",
      });
    }

    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (title.length < 2 || title.length > 160) {
      return res.status(400).json({
        success: false,
        message: "Task title must be between 2 and 160 characters",
      });
    }

    if (description.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 3000 characters",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const membership = await Workspace.exists({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace",
      });
    }

    const priority = req.body.priority ?? "medium";

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    let dueDate = null;

    if (req.body.dueDate) {
      dueDate = new Date(req.body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }
    }

    let assignee = null;

    if (
      req.body.assignee !== undefined &&
      req.body.assignee !== null &&
      req.body.assignee !== ""
    ) {
      if (
        typeof req.body.assignee !== "string" ||
        !mongoose.isValidObjectId(req.body.assignee)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee ID",
        });
      }

      const isMember = await Workspace.exists({
        _id: workspaceId,
        "members.user": req.body.assignee,
      });

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "Assignee must be a member of this workspace",
        });
      }

      assignee = req.body.assignee;
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      workspace: workspaceId,
      createdBy: req.user._id,
      priority,
      dueDate,
      assignee,
    });

    try {
      await recordTaskActivity({
        workspaceId,
        projectId,
        taskId: task._id,
        actorId: req.user._id,
        action: "task_created",
        details: `Created task: ${task.title}`,
      });
    } catch (error) {
      console.error("Task creation activity error:", error);
    }

    // Notify the assignee if the task was assigned to another user.
    if (
      assignee &&
      assignee.toString() !== req.user._id.toString()
    ) {
      await createNotificationSafely(
        {
          recipient: assignee,
          actor: req.user._id,
          workspace: workspaceId,
          project: projectId,
          task: task._id,
          type: "task_assigned",
          message: `You have been assigned the task "${task.title}".`,
        },
        req.app.get("io")
      );
    }

    await task.populate("assignee", "name email");
    await task.populate("createdBy", "name");

    return res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

// PATCH /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
export const updateTask = async (req, res) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace, project, or task ID",
      });
    }

    const membership = await Workspace.exists({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      workspace: workspaceId,
      project: projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const previousStatus = task.status;
    const previousAssignee = task.assignee?.toString() || "";
    const previousTitle = task.title;
    const previousDescription = task.description;
    const previousPriority = task.priority;
    const previousDueDate = task.dueDate?.toISOString() || "";

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "assignee",
    ];

    for (const field of allowedFields) {
      if (!(field in req.body)) continue;

      const value = req.body[field];

      if (field === "title") {
        if (
          typeof value !== "string" ||
          value.trim().length < 2 ||
          value.trim().length > 160
        ) {
          return res.status(400).json({
            success: false,
            message: "Task title must be between 2 and 160 characters",
          });
        }

        task.title = value.trim();
      } else if (field === "description") {
        if (
          typeof value !== "string" ||
          value.trim().length > 3000
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid task description",
          });
        }

        task.description = value.trim();
      } else if (field === "status") {
        if (!validStatuses.includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Invalid task status",
          });
        }

        task.status = value;
      } else if (field === "priority") {
        if (!validPriorities.includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Invalid task priority",
          });
        }

        task.priority = value;
      } else if (field === "assignee") {
        if (value === null || value === "") {
          task.assignee = null;
        } else {
          if (
            typeof value !== "string" ||
            !mongoose.isValidObjectId(value)
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid assignee ID",
            });
          }

          const isMember = await Workspace.exists({
            _id: workspaceId,
            "members.user": value,
          });

          if (!isMember) {
            return res.status(400).json({
              success: false,
              message: "Assignee must be a member of this workspace",
            });
          }

          task.assignee = value;
        }
      } else if (field === "dueDate") {
        if (value === null || value === "") {
          task.dueDate = null;
        } else {
          const date = new Date(value);

          if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
              success: false,
              message: "Invalid due date",
            });
          }

          task.dueDate = date;
        }
      }
    }

    // Save first so notification failures cannot undo the task update.
    await task.save();

    const currentAssignee = task.assignee?.toString() || "";
    const currentDueDate = task.dueDate?.toISOString() || "";

    // Notify only when the assignee changes to a different user.
    if (
      currentAssignee &&
      currentAssignee !== previousAssignee &&
      currentAssignee !== req.user._id.toString()
    ) {
      await createNotificationSafely(
        {
          recipient: currentAssignee,
          actor: req.user._id,
          workspace: workspaceId,
          project: projectId,
          task: task._id,
          type: "task_assigned",
          message: `You have been assigned the task "${task.title}".`,
        },
        req.app.get("io")
      );
    }

    // Record activity separately so activity errors don't fail the update.
    try {
      if (previousStatus !== task.status) {
        await recordTaskActivity({
          workspaceId,
          projectId,
          taskId: task._id,
          actorId: req.user._id,
          action: "status_changed",
          details: `Changed status from ${previousStatus} to ${task.status}`,
        });
      }

      if (previousAssignee !== currentAssignee) {
        await recordTaskActivity({
          workspaceId,
          projectId,
          taskId: task._id,
          actorId: req.user._id,
          action: "task_assigned",
          details: currentAssignee
            ? "Changed task assignee"
            : "Removed task assignee",
        });
      }

      const changedFields = [];

      if (previousTitle !== task.title) changedFields.push("title");
      if (previousDescription !== task.description) {
        changedFields.push("description");
      }
      if (previousPriority !== task.priority) {
        changedFields.push("priority");
      }
      if (previousDueDate !== currentDueDate) {
        changedFields.push("due date");
      }

      if (changedFields.length > 0) {
        await recordTaskActivity({
          workspaceId,
          projectId,
          taskId: task._id,
          actorId: req.user._id,
          action: "task_updated",
          details: `Updated task ${changedFields.join(", ")}`,
        });
      }
    } catch (activityError) {
      console.error("Task activity logging error:", activityError);
    }

    await task.populate("assignee", "name email");
    await task.populate("createdBy", "name");

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

// DELETE /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
export const deleteTask = async (req, res) => {
  try {
    const { workspaceId, projectId, taskId } = req.params;

    if (
      !mongoose.isValidObjectId(workspaceId) ||
      !mongoose.isValidObjectId(projectId) ||
      !mongoose.isValidObjectId(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace, project, or task ID",
      });
    }

    const membership = await Workspace.exists({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace",
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      workspace: workspaceId,
      project: projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    try {
      await recordTaskActivity({
        workspaceId,
        projectId,
        taskId: task._id,
        actorId: req.user._id,
        action: "task_deleted",
        details: `Deleted task: ${task.title}`,
      });
    } catch (activityError) {
      console.error("Task deletion activity logging error:", activityError);
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};
