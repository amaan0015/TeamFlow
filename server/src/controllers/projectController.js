
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";

export const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Project name must be between 2 and 100 characters",
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or access denied",
      });
    }

    const project = await Project.create({
      name,
      description,
      workspace: workspace._id,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.exists({
      _id: workspaceId,
      "members.user": req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or access denied",
      });
    }

    const projects = await Project.find({ workspace: workspaceId })
      .sort({ updatedAt: -1 })
      .populate("createdBy", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};
