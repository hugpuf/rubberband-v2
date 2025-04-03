
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
    <Card className="w-full bg-[#FAFAFA] border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[#1C1C1E] text-lg font-normal">
          <Bot className="h-5 w-5 stroke-[1.5px]" />
          AI Copilot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask your copilot something..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-white text-[#636366] border-[#DCDCDC] rounded-full placeholder:text-gray-400"
          />
          <Button type="submit" variant="outline" className="bg-[#6E7FFE] text-white border-none hover:bg-[#5D6FEE] rounded-full transition-all">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="mt-4">
          <p className="text-xs text-[#636366] mb-2 tracking-wide">Try asking about:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
            {suggestedPrompts.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs text-[#636366] border border-[#E0E0E0] whitespace-nowrap hover:bg-[#F5F5F7] bg-white rounded-full transition-all"
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
