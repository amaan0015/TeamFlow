
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "archived"],
      default: "planning",
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

projectSchema.index({ workspace: 1, updatedAt: -1 });

const Project =
  mongoose.models.Project ||
  mongoose.model("Project", projectSchema);

export default Project;
