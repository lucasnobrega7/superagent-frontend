/**
 * Core schema definitions using Zod
 * Provides type validation for API input/output
 */
import { z } from 'zod';

// Base error schema
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

// Authentication data schema
export const AuthSchema = z.object({
  uid: z.string(),
  token: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
  }).optional(),
});

// Base response schema
export const ResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
});

// Thread schemas
export const ThreadMetadataSchema = z.record(z.any()).optional();

export const CreateThreadSchema = z.object({
  name: z.string().min(1, "Thread name is required"),
  metadata: ThreadMetadataSchema,
});

export const ThreadResponseSchema = ResponseSchema.extend({
  threadId: z.string(),
});

export const ListThreadsParamsSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});

export const ListThreadsResponseSchema = ResponseSchema.extend({
  threads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    metadata: z.record(z.any()).optional(),
    createdAt: z.string(),
  })),
});

// Step schemas
export const CreateStepSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  name: z.string().min(1, "Step name is required"),
  type: z.string().min(1, "Step type is required"),
  metadata: z.record(z.any()).optional(),
});

export const StepResponseSchema = ResponseSchema.extend({
  stepId: z.string(),
});

// Message tracking schemas
export const TrackMessageSchema = z.object({
  stepId: z.string().min(1, "Step ID is required"),
  message: z.string().min(1, "Message content is required"),
  metadata: z.record(z.any()).optional(),
});

export const TrackMessageResponseSchema = ResponseSchema;

// Types generated from the schemas
export type Error = z.infer<typeof ErrorSchema>;
export type Auth = z.infer<typeof AuthSchema>;
export type CreateThreadParams = z.infer<typeof CreateThreadSchema>;
export type ThreadResponse = z.infer<typeof ThreadResponseSchema>;
export type ListThreadsParams = z.infer<typeof ListThreadsParamsSchema>;
export type ListThreadsResponse = z.infer<typeof ListThreadsResponseSchema>;
export type CreateStepParams = z.infer<typeof CreateStepSchema>;
export type StepResponse = z.infer<typeof StepResponseSchema>;
export type TrackMessageParams = z.infer<typeof TrackMessageSchema>;
export type TrackMessageResponse = z.infer<typeof TrackMessageResponseSchema>;