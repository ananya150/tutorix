import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { GridPattern } from "../components/grid-pattern";
import { Textarea } from "../components/ui/text-area";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface LessonConfig {
  topic: string;
  depth: string;
}

interface GenerateLessonResponse {
  success: boolean;
  error?: string;
  lessonId?: string;
  lessonPlan?: any;
  generatedAt?: string;
  requestedDuration?: number;
  actualDuration?: number;
  savedToDatabase?: boolean;
  databaseId?: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LessonConfig>({
    topic: '',
    depth: '5',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.topic.trim()) return;
    
    setIsLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Creating your personalized lesson...", {
      description: `Generating ${config.depth}-minute lesson on "${config.topic}"`
    });
    
    try {
      // Call the generate-lesson endpoint
      const lessonId = crypto.randomUUID();
      const response = await fetch('/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: config.topic,
          depth: config.depth,
          lessonId: lessonId
        })
      });
      
      const result: GenerateLessonResponse = await response.json();
      console.log('Generate lesson response:', result);
      
      if (result.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Lesson created successfully!", {
          description: `Your ${config.depth}-minute lesson is ready. Redirecting...`
        });
        
        // Small delay to show success message before navigation
        setTimeout(() => {
          // Navigate to lesson page with config as state
          navigate(`/lesson/${lessonId}`, { 
            state: { config } 
          });
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to create lesson');
      }
      
    } catch (error) {
      console.error('Error calling generate-lesson:', error);
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("Failed to create lesson", {
        description: error instanceof Error ? error.message : "Please try again"
      });
      
      setIsLoading(false);
    }
  };

  const depthOptions = [
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
  ];

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <div className="flex flex-col items-center justify-center gap-8 z-10 max-w-2xl w-full px-6">
        <div className="text-center space-y-2">
          <p className="whitespace-pre-wrap text-5xl font-medium tracking-tighter text-black">
            What would you like to learn?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative">
            <Textarea 
              value={config.topic}
              onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
              className="rounded-lg p-4 min-h-[120px] text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0" 
              placeholder="Enter your topic here...')"
              autoFocus
              disabled={isLoading}
            />
            <div className="absolute bottom-3 left-3">
              <Select value={config.depth} onValueChange={(value) => setConfig(prev => ({ ...prev, depth: value }))} disabled={isLoading}>
                <SelectTrigger className="w-[120px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {depthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="absolute bottom-3 right-3">
              <Button 
                type="submit" 
                disabled={!config.topic.trim() || isLoading}
                size='sm'
                className="bg-black text-white"
              >
                {isLoading ? 'Creating...' : 'Start Course'}
              </Button>
            </div>
          </div>
        </form>

      </div>

      <GridPattern
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
          [15, 10],
          [10, 15],
          [15, 10],
          [10, 15],
          [15, 10],
        ]}
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />
    </div>
  );
}

