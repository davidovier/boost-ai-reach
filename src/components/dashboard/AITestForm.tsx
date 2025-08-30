import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles } from 'lucide-react';

const aiTestSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be less than 500 characters')
});

type AITestFormData = z.infer<typeof aiTestSchema>;

interface AITestFormProps {
  onSubmit: (prompt: string) => Promise<void>;
  isLoading?: boolean;
}

export function AITestForm({ onSubmit, isLoading = false }: AITestFormProps) {
  const form = useForm<AITestFormData>({
    resolver: zodResolver(aiTestSchema),
    defaultValues: {
      prompt: ''
    }
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: AITestFormData) => {
    try {
      setSubmitting(true);
      await onSubmit(data.prompt);
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLoading = isLoading || submitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder="Enter your AI prompt here..."
                    className="min-h-[100px] resize-none"
                    disabled={isFormLoading}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    e.g., "Best marketing agencies in London"
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={isFormLoading}
          className="w-full"
        >
          {isFormLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run AI Test
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}