import api from "./api";

export const addWorkspaceMember = async (workspaceId, email) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/members`,
    { email }
  );

  return response.data.member;
};