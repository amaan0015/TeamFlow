
import api from "./api";

export const getTasks = async (workspaceId, projectId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks`
  );

  return response.data.tasks;
};

export const createTask = async (workspaceId, projectId, taskData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    taskData
  );

  return response.data.task;
};

export const updateTask = async (
  workspaceId,
  projectId,
  taskId,
  changes
) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    changes
  );

  return response.data.task;
};


export const deleteTask = async (workspaceId, projectId, taskId) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
  );

  return response.data;
};

