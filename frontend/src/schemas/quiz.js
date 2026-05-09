import { z } from 'zod';

/**
 * Shared field shape for both Create-Quiz and Edit-Quiz forms.
 *
 * Keep this in sync with the backend Quiz entity / DTO. When you add a
 * new quiz field on the backend, add it here and it shows up in both
 * forms automatically — no more silent field drops in `reset()`.
 */
export const quizFieldsSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().optional().default(''),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
        required_error: 'Select a difficulty',
    }),
    quizType: z.enum(['PRACTICE', 'EXAM', 'SURVEY'], {
        required_error: 'Select a quiz type',
    }),
    passMarks: z.coerce.number().min(0).optional().or(z.literal('')),
    timeLimitSeconds: z.coerce
        .number()
        .min(60, 'Must be at least 60 seconds')
        .optional()
        .or(z.literal('')),
    categoryUuid: z.string().optional().default(''),
    maxAttempts: z.coerce
        .number()
        .min(0, 'Max attempts cannot be negative')
        .max(100, 'Max attempts cannot exceed 100')
        .optional()
        .or(z.literal('')),
    cooldownHours: z.coerce
        .number()
        .min(0)
        .max(720, 'Cooldown cannot exceed 720 hours')
        .optional()
        .or(z.literal('')),
    questionsToServe: z.coerce
        .number()
        .min(1, 'Questions to serve must be at least 1')
        .optional()
        .or(z.literal('')),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(false),
    showLeaderboard: z.boolean().default(false),
    accessCode: z.string().max(20).optional().default(''),
    startsAt: z.string().optional().default(''),
    expiresAt: z.string().optional().default(''),
});

const expiryAfterStart = (d) => {
    if (d.startsAt && d.expiresAt) {
        return new Date(d.expiresAt) > new Date(d.startsAt);
    }
    return true;
};
const expiryAfterStartIssue = {
    message: 'Expiry must be after the start date',
    path: ['expiresAt'],
};

const startsInFutureIssue = {
    message: 'Start date must be in the present or future',
    path: ['startsAt'],
};

/** Schema for creating a new quiz — start date must be in the future. */
export const createQuizSchema = quizFieldsSchema
    .refine((d) => {
        if (!d.startsAt) return true;
        return new Date(d.startsAt).getTime() >= Date.now();
    }, startsInFutureIssue)
    .refine(expiryAfterStart, expiryAfterStartIssue);

/** Schema for editing an existing quiz — start date check is dropped
 *  because the quiz may already have started. */
export const updateQuizSchema = quizFieldsSchema.refine(
    expiryAfterStart,
    expiryAfterStartIssue
);

/**
 * Default values shared between Create and Edit forms. Keeps RHF's
 * `defaultValues` aligned with the schema so unsaved fields don't get
 * dropped silently on submit.
 */
export const quizFormDefaults = {
    title: '',
    description: '',
    difficulty: '',
    quizType: '',
    passMarks: '',
    timeLimitSeconds: '',
    categoryUuid: '',
    maxAttempts: '',
    cooldownHours: '',
    questionsToServe: '',
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: false,
    showLeaderboard: false,
    accessCode: '',
    startsAt: '',
    expiresAt: '',
};
