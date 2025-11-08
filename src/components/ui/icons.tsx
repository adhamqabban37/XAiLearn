import { cn } from "@/lib/utils";

export const HelpCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-help-circle", className)}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

export const LightbulbIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-lightbulb", className)}
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const StarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-star", className)}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const QuestionMarkIcon = ({ className }: { className?: string }) => (
    <svg 
        className={cn("lucide lucide-help-circle", className)}
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);


export function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://wwws.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 01.75.75V9a.75.75 0 01-1.5 0V5.25A.75.75 0 019 4.5zM12.75 7.5a.75.75 0 000-1.5H8.25a.75.75 0 000 1.5h4.5zM10.5 12a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM15 15.75a.75.75 0 00.75-.75V12a.75.75 0 00-1.5 0v3a.75.75 0 00.75.75zM4.125 15a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.25 12.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM18.75 9.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.V75.75 0 01-.75-.75zM20.25 12a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 2.25zM14.25 4.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM12 18.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM14.25 21a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}
