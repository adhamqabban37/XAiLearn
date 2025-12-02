export interface QuizQuestion {
    id: string;
    questionText: string;
    answerText: string;
    options?: string[]; // optional MCQ choices
    explanation?: string; // Added to match existing schema
}

export interface QuizPaper {
    id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
}

export const QUIZ_PAPERS: QuizPaper[] = [
    {
        id: "paper-1",
        title: "Paper 1: Fundamentals",
        description: "Basic concepts and definitions.",
        questions: [
            {
                id: "p1-q1",
                questionText: "What is the primary function of a CPU?",
                answerText: "To execute instructions from computer programs.",
                options: [
                    "To store data permanently.",
                    "To execute instructions from computer programs.",
                    "To display images on the screen.",
                    "To manage network connections."
                ],
                explanation: "The CPU (Central Processing Unit) is the brain of the computer, responsible for fetching, decoding, and executing instructions."
            },
            {
                id: "p1-q2",
                questionText: "Which of the following is a non-volatile memory type?",
                answerText: "ROM",
                options: [
                    "RAM",
                    "Cache",
                    "ROM",
                    "Register"
                ],
                explanation: "ROM (Read-Only Memory) retains its data even when the power is turned off, making it non-volatile."
            }
        ],
    },
    {
        id: "paper-2",
        title: "Paper 2: Advanced Topics",
        description: "Deep dive into complex systems.",
        questions: [
            {
                id: "p2-q1",
                questionText: "What is the time complexity of binary search?",
                answerText: "O(log n)",
                options: [
                    "O(n)",
                    "O(n^2)",
                    "O(log n)",
                    "O(1)"
                ],
                explanation: "Binary search divides the search interval in half with each step, resulting in logarithmic time complexity."
            }
        ]
    }
];

export function getQuizPaperById(id: string): QuizPaper | undefined {
    return QUIZ_PAPERS.find((paper) => paper.id === id);
}
