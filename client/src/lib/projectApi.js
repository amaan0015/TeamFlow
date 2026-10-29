
import api from "./api";

export const getProjects = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/projects`
  );

  return response.data.projects;
};

export const createProject = async (workspaceId, projectData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/projects`,
    projectData
  );

  return response.data.project;
};
