import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import { recordTaskActivity } from "./activityController.js";
import Notification from "../models/Notification.js";

const createNotificationSafely = async (notificationData) => {
  try {
    await Notification.create(notificationData);
  } catch (error) {
    console.error("Notification creation error:", error.message);
  }
};

const verifyTaskAccess = async (req, res) => {
  const { workspaceId, projectId, taskId } = req.params;

  if (
    !mongoose.isValidObjectId(workspaceId) ||
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(taskId)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid workspace, project, or task ID",
    });
    return null;
  }

  const membership = await Workspace.exists({
    _id: workspaceId,
    "members.user": req.user._id,
  });

  if (!membership) {
    res.status(403).json({
      success: false,
      message: "You do not have access to this workspace",
    });
    return null;
  }

  const task = await Task.findOne({
    _id: taskId,
    project: projectId,
    workspace: workspaceId,
  }).lean();

  if (!task) {
    res.status(404).json({
      success: false,
      message: "Task not found",
    });
    return null;
  }

  return task;
};

export const getTaskComments = async (req, res) => {
  try {
    const task = await verifyTaskAccess(req, res);
    if (!task) return;

    const { workspaceId, projectId, taskId } = req.params;

    const comments = await Comment.find({
      task: taskId,
      project: projectId,
      workspace: workspaceId,
    })
      .populate("author", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get task comments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};

export const createTaskComment = async (req, res) => {
  try {
    const task = await verifyTaskAccess(req, res);
    if (!task) return;

    const text =
      typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text || text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment must contain 1-2000 characters",
      });
    }

    const comment = await Comment.create({
      task: task._id,
      project: task.project,
      workspace: task.workspace,
      author: req.user._id,
      text,
    });

    await comment.populate("author", "name email");

    if (
  task.assignee &&
  task.assignee.toString() !== req.user._id.toString()
) {
  await createNotificationSafely({
    recipient: task.assignee,
    actor: req.user._id,
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    type: "comment_added",
    message: `${comment.author.name} commented on "${task.title}"`,
  });
}

    try {
  await recordTaskActivity({
    workspaceId: task.workspace,
    projectId: task.project,
    taskId: task._id,
    actorId: req.user._id,
    action: "comment_added",
    details: "Added a comment",
  });
} catch (activityError) {
  console.error("Comment activity logging error:", activityError.message);
}

    return res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Create task comment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
};