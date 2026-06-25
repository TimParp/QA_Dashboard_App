import { describe, it, expect } from "vitest";
import {
  issueVisibilityWhere,
  projectVisibilityWhere,
  assertAuthorized,
} from "@/lib/authz/visibility";
import type { AuthUser } from "@/lib/authz/authorize";
import { ForbiddenError } from "@/lib/errors";

const admin: AuthUser = { id: "a", role: "ADMIN", clientId: null, projectIds: [] };
const client: AuthUser = { id: "c", role: "CLIENT", clientId: "c1", projectIds: [] };
const clientNoId: AuthUser = { id: "c0", role: "CLIENT", clientId: "", projectIds: [] };
const qa: AuthUser = { id: "q", role: "QA", clientId: null, projectIds: ["p1", "p2"] };
const qaNoProjects: AuthUser = { id: "q0", role: "QA", clientId: null, projectIds: [] };

describe("issueVisibilityWhere", () => {
  it("returns empty filter for admin", () => {
    expect(issueVisibilityWhere(admin)).toEqual({});
  });
  it("scopes a client to their own client's projects", () => {
    expect(issueVisibilityWhere(client)).toEqual({ project: { clientId: "c1" } });
  });
  it("denies a client with an empty clientId", () => {
    expect(issueVisibilityWhere(clientNoId)).toEqual({ id: { in: [] } });
  });
  it("scopes QA/dev to their member projects", () => {
    expect(issueVisibilityWhere(qa)).toEqual({ projectId: { in: ["p1", "p2"] } });
  });
  it("denies QA/dev with no memberships", () => {
    expect(issueVisibilityWhere(qaNoProjects)).toEqual({ id: { in: [] } });
  });
});

describe("projectVisibilityWhere", () => {
  it("returns empty filter for admin", () => {
    expect(projectVisibilityWhere(admin)).toEqual({});
  });
  it("scopes a client by clientId", () => {
    expect(projectVisibilityWhere(client)).toEqual({ clientId: "c1" });
  });
  it("denies a client with empty clientId", () => {
    expect(projectVisibilityWhere(clientNoId)).toEqual({ id: { in: [] } });
  });
  it("scopes QA/dev by membership", () => {
    expect(projectVisibilityWhere(qa)).toEqual({ id: { in: ["p1", "p2"] } });
  });
  it("denies QA/dev with no memberships", () => {
    expect(projectVisibilityWhere(qaNoProjects)).toEqual({ id: { in: [] } });
  });
});

describe("assertAuthorized", () => {
  it("does not throw when allowed", () => {
    expect(() => assertAuthorized(admin, "manageUsers", null)).not.toThrow();
    expect(() =>
      assertAuthorized(qa, "createIssue", { id: "p1", clientId: "x" }),
    ).not.toThrow();
  });
  it("throws ForbiddenError when not allowed", () => {
    expect(() =>
      assertAuthorized(client, "editIssue", { id: "p1", clientId: "c1" }),
    ).toThrow(ForbiddenError);
    expect(() => assertAuthorized(qa, "manageUsers", null)).toThrow(ForbiddenError);
  });
});
