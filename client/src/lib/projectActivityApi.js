
import api from "./api";

export const getProjectActivities = async (workspaceId, projectId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}/activities`
  );

  return response.data.activities;
};

