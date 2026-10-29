
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "status_changed",
        "task_assigned",
        "task_deleted",
        "comment_added",
      ],
      required: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

activitySchema.index({ task: 1, createdAt: -1 });

const Activity =
  mongoose.models.Activity ||
  mongoose.model("Activity", activitySchema);

export default Activity;
