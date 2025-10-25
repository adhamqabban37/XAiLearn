import { Progress } from "@/components/ui/progress";

interface LessonProgressBarProps {
  completedSteps: number;
  totalSteps: number;
}

export function LessonProgressBar({ completedSteps, totalSteps }: LessonProgressBarProps) {
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="w-full my-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-primary">Session Progress</span>
        <span className="text-xs text-muted-foreground">{completedSteps} of {totalSteps} steps completed</span>
      </div>
      <Progress value={progressPercentage} className="w-full h-2" />
    </div>
  );
}
