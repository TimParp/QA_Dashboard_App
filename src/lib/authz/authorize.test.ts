import { describe, it, expect } from "vitest";
import { authorize, canViewProject, type AuthUser, type ProjectRef } from "@/lib/authz/authorize";

const projectA: ProjectRef = { id: "p1", clientId: "c1" };
const projectB: ProjectRef = { id: "p2", clientId: "c2" };

const admin: AuthUser = { id: "u-admin", role: "ADMIN", clientId: null, projectIds: [] };
const qa: AuthUser = { id: "u-qa", role: "QA", clientId: null, projectIds: ["p1"] };
const dev: AuthUser = { id: "u-dev", role: "DEVELOPER", clientId: null, projectIds: ["p1"] };
const clientC1: AuthUser = { id: "u-client", role: "CLIENT", clientId: "c1", projectIds: [] };

describe("canViewProject", () => {
  it("lets admin view any project", () => {
    expect(canViewProject(admin, projectA)).toBe(true);
    expect(canViewProject(admin, projectB)).toBe(true);
  });

  it("lets a client view only their own client's projects", () => {
    expect(canViewProject(clientC1, projectA)).toBe(true);
    expect(canViewProject(clientC1, projectB)).toBe(false);
  });

  it("lets QA/dev view only projects they are members of", () => {
    expect(canViewProject(qa, projectA)).toBe(true);
    expect(canViewProject(qa, projectB)).toBe(false);
    expect(canViewProject(dev, projectA)).toBe(true);
    expect(canViewProject(dev, projectB)).toBe(false);
  });
});

describe("authorize", () => {
  it("makes user/client management admin-only", () => {
    expect(authorize(admin, "manageUsers", null)).toBe(true);
    expect(authorize(admin, "manageClients", null)).toBe(true);
    expect(authorize(qa, "manageUsers", null)).toBe(false);
    expect(authorize(clientC1, "manageClients", null)).toBe(false);
  });

  it("lets a client create issues and comment on their own project but not edit", () => {
    expect(authorize(clientC1, "viewProject", projectA)).toBe(true);
    expect(authorize(clientC1, "createIssue", projectA)).toBe(true);
    expect(authorize(clientC1, "comment", projectA)).toBe(true);
    expect(authorize(clientC1, "editIssue", projectA)).toBe(false);
    expect(authorize(clientC1, "changeStatus", projectA)).toBe(false);
    expect(authorize(clientC1, "assignIssue", projectA)).toBe(false);
  });

  it("blocks a client entirely on another client's project", () => {
    expect(authorize(clientC1, "createIssue", projectB)).toBe(false);
    expect(authorize(clientC1, "viewProject", projectB)).toBe(false);
  });

  it("lets QA and developers edit/change-status/assign on their projects", () => {
    for (const u of [qa, dev]) {
      expect(authorize(u, "viewProject", projectA)).toBe(true);
      expect(authorize(u, "editIssue", projectA)).toBe(true);
      expect(authorize(u, "changeStatus", projectA)).toBe(true);
      expect(authorize(u, "assignIssue", projectA)).toBe(true);
    }
  });

  it("blocks QA/dev on projects they are not members of", () => {
    expect(authorize(qa, "viewProject", projectB)).toBe(false);
    expect(authorize(qa, "editIssue", projectB)).toBe(false);
    expect(authorize(dev, "createIssue", projectB)).toBe(false);
  });

  it("returns false for a non-admin action with no project", () => {
    expect(authorize(qa, "createIssue", null)).toBe(false);
  });

  it("denies QA/dev on a non-member project even when clientId coincides", () => {
    const qaWithClient: AuthUser = { id: "u-qa2", role: "QA", clientId: "c1", projectIds: [] };
    expect(canViewProject(qaWithClient, projectA)).toBe(false);
    expect(authorize(qaWithClient, "viewProject", projectA)).toBe(false);
  });

  it("lets anyone who can view the project upload attachments", () => {
    expect(authorize(clientC1, "uploadAttachment", projectA)).toBe(true);
    expect(authorize(qa, "uploadAttachment", projectA)).toBe(true);
    expect(authorize(dev, "uploadAttachment", projectA)).toBe(true);
    expect(authorize(clientC1, "uploadAttachment", projectB)).toBe(false);
  });
});
