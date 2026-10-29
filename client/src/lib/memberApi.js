import api from "./api";

export const getWorkspaceMembers = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}/members`);
  return response.data.members;
};