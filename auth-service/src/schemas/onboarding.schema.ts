import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
  useCase: z
    .string()
    .refine(
      (string) =>
        string === 'WORK' || string === 'STUDY' || string === 'PERSONAL_USE'
    ),
  workspaceName: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .refine((name) => /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u.test(name)),
  workspaceImage: z.string().optional().nullable(),
  leetcodeUsername: z.string().optional().nullable(),
  codeforcesUsername: z.string().optional().nullable(),
  codechefUsername: z.string().optional().nullable(),
  githubUsername: z.string().optional().nullable(),
  redditUsername: z.string().optional().nullable(),
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
