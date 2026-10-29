
import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

export const createWorkspace = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Workspace name must be between 2 and 80 characters",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 500 characters",
      });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create workspace",
    });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("owner", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    console.error("Get workspaces error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces",
    });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id,
    })
      .populate("members.user", "name email")
      .lean();

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found or you do not have access",
      });
    }

    const members = workspace.members
      .filter((member) => member.user)
      .map((member) => ({
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      }));

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get workspace members error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspace members",
    });
  }
};

export const addWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (!email || email.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Only workspace owners and admins can add members.
    const currentMember = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (
      !currentMember ||
      !["owner", "admin"].includes(currentMember.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can add members",
      });
    }

    const userToAdd = await User.findOne({ email }).select("name email");

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "No registered user found with that email",
      });
    }

    const alreadyMember = workspace.members.some(
      (member) => member.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "This user is already a workspace member",
      });
    }

    workspace.members.push({
      user: userToAdd._id,
      role: "member",
    });

    await workspace.save();

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: {
        _id: userToAdd._id,
        name: userToAdd.name,
        email: userToAdd.email,
        role: "member",
      },
    });
  } catch (error) {
    console.error("Add workspace member error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to add workspace member",
    });
  }
};