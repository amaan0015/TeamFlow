
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import Project from "../models/Project.js";

export const getTaskActivities = async (req, res) => {
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

    const project = await Project.exists({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const task = await Task.exists({
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

    const activities = await Activity.find({
      workspace: workspaceId,
      project: projectId,
      task: taskId,
    })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get task activities error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task activities",
    });
  }
};

export const recordTaskActivity = async ({
  workspaceId,
  projectId,
  taskId,
  actorId,
  action,
  details = "",
}) => {
  return Activity.create({
    workspace: workspaceId,
    project: projectId,
    task: taskId,
    actor: actorId,
    action,
    details,
  });
};



export const getProjectActivities = async (req, res) => {
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

    const project = await Project.exists({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const activities = await Activity.find({
      workspace: workspaceId,
      project: projectId,
    })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get project activities error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project activities",
    });
  }
};
