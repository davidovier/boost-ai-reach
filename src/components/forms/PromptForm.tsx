import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const promptSchema = z.object({
  prompt: z.string()
    .min(10, "Prompt must be at least 10 characters")
    .max(500, "Prompt must be less than 500 characters")
});

type PromptFormData = z.infer<typeof promptSchema>;

interface PromptFormProps {
  onSubmit: (data: PromptFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PromptForm({ onSubmit, isLoading = false }: PromptFormProps) {
  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: ""
    }
  });

  const handleSubmit = async (data: PromptFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ask AI something that might reference your business (e.g., 'Best marketing agencies in London')"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run AI Test
        </Button>
      </form>
    </Form>
  );
}