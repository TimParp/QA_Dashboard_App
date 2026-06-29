export type Role = "ADMIN" | "QA" | "DEVELOPER" | "CLIENT";

export type AuthUser = {
  id: string;
  role: Role;
  clientId: string | null;
  projectIds: string[];
};

export type ProjectRef = { id: string; clientId: string };

export type Action =
  | "manageUsers"
  | "manageClients"
  | "viewProject"
  | "createIssue"
  | "editIssue"
  | "changeStatus"
  | "assignIssue"
  | "comment"
  | "uploadAttachment";

const ADMIN_ONLY: Action[] = ["manageUsers", "manageClients"];
const STAFF_WRITE: Action[] = ["editIssue", "changeStatus", "assignIssue"];

export function canViewProject(user: AuthUser, project: ProjectRef): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "CLIENT") return user.clientId === project.clientId;
  // QA or DEVELOPER
  return user.projectIds.includes(project.id);
}

export function authorize(
  user: AuthUser,
  action: Action,
  project: ProjectRef | null,
): boolean {
  if (user.role === "ADMIN") return true;

  if (ADMIN_ONLY.includes(action)) return false;

  // All remaining actions require a project the user can view.
  if (project === null) return false;
  if (!canViewProject(user, project)) return false;

  // Clients can view, create issues, and comment, but cannot edit/triage.
  if (user.role === "CLIENT") {
    return !STAFF_WRITE.includes(action);
  }

  // QA and DEVELOPER can do all non-admin actions on visible projects.
  return true;
}
