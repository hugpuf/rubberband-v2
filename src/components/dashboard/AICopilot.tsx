
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, ArrowRight } from "lucide-react";

// Placeholder suggested prompts
const suggestedPrompts = [
  "Show me this month's revenue",
  "How can I improve team productivity?",
  "Analyze recent customer feedback",
  "Identify cost-saving opportunities",
  "Summarize project milestones",
];

export function AICopilot() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`In a real implementation, this would process: "${prompt}"`);
    setPrompt("");
  };

  const handleSuggestedPrompt = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <Card className="w-full bg-rubberband-dark">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <Bot className="h-5 w-5" />
          AI Copilot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask your copilot something..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
          />
          <Button type="submit" variant="outline" className="bg-rubberband-primary text-white border-none hover:bg-rubberband-secondary">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="mt-4">
          <p className="text-xs text-white/60 mb-2">Try asking about:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
            {suggestedPrompts.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs text-white border-white/20 whitespace-nowrap hover:bg-white/10 bg-transparent"
                onClick={() => handleSuggestedPrompt(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
