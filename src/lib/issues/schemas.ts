import { z } from "zod";

export const issueTypeEnum = z.enum(["BUG", "FEATURE"]);
export const issueStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
]);
export const issuePriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const issueSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const issueFilterSchema = z.object({
  projectId: z.string().optional(),
  status: issueStatusEnum.optional(),
  priority: issuePriorityEnum.optional(),
  type: issueTypeEnum.optional(),
  assignedToId: z.string().optional(),
});

export type IssueFilter = z.infer<typeof issueFilterSchema>;

export const createIssueSchema = z
  .object({
    projectId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    type: issueTypeEnum,
    priority: issuePriorityEnum.default("MEDIUM"),
    stepsToReproduce: z.string().optional(),
    expectedResult: z.string().optional(),
    actualResult: z.string().optional(),
    environment: z.string().optional(),
    pageOrFeature: z.string().optional(),
    role: z.string().optional(),
    severity: issueSeverityEnum.optional(),
  })
  .strip();

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = createIssueSchema
  .omit({ projectId: true })
  .extend({ issueId: z.string().min(1) });

export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
