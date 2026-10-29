
import api from "./api";

export const getTaskComments = async (
  workspaceId,
  projectId,
  taskId
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`
  );

  return response.data.comments;
};

export const createTaskComment = async (
  workspaceId,
  projectId,
  taskId,
  text
) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    { text }
  );

  return response.data.comment;
};
