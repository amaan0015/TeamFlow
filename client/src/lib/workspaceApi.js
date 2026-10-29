
import api from "./api";

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces");
  return response.data.workspaces;
};

export const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);
  return response.data.workspace;
};
