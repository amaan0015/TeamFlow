import api from "./api";

export const getTaskActivities = async (
  workspaceId,
  projectId,
  taskId
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/activities`
  );

  return response.data.activities;
};