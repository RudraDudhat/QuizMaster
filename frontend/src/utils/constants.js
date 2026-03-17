export const QUESTION_TYPES = [
    { value: 'MCQ_SINGLE', label: 'Multiple Choice (Single Answer)' },
    { value: 'MCQ_MULTI', label: 'Multiple Choice (Multiple Answers)' },
    { value: 'TRUE_FALSE', label: 'True / False' },
    { value: 'SHORT_ANSWER', label: 'Short Answer' },
    { value: 'ESSAY', label: 'Essay' },
    { value: 'FILL_IN_THE_BLANK', label: 'Fill in the Blank' },
    { value: 'ORDERING', label: 'Ordering' },
    { value: 'MATCH_THE_FOLLOWING', label: 'Match the Following' },
    { value: 'CODE_SNIPPET', label: 'Code Snippet' },
    { value: 'IMAGE_BASED', label: 'Image Based' },
];

export const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' },
];

export const QUIZ_STATUSES = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'SCHEDULED', label: 'Scheduled' },
];

export const ATTEMPT_STATUSES = [
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'AUTO_SUBMITTED', label: 'Auto Submitted' },
    { value: 'INVALIDATED', label: 'Invalidated' },
];

export const ROLES = {
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    STUDENT: 'STUDENT',
};

export const PAGE_SIZE = 20;
