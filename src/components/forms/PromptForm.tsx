import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Sparkles } from "lucide-react";

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
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="prompt-form space-y-6"
        aria-label="AI Findability Test Form"
        noValidate
      >
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem className="prompt-form__field">
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    placeholder=" "
                    className="prompt-form__textarea peer min-h-[120px] pt-6 resize-none"
                    aria-describedby={`prompt-hint ${form.formState.errors.prompt ? 'prompt-error' : ''}`}
                    aria-invalid={!!form.formState.errors.prompt}
                    aria-required="true"
                  />
                  <FormLabel 
                    className="prompt-form__label absolute left-3 top-3 transition-all duration-200 ease-out pointer-events-none
                      peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground
                      peer-focus:top-2 peer-focus:text-sm peer-focus:text-primary
                      peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-primary"
                    htmlFor={field.name}
                  >
                    Enter your AI prompt...
                  </FormLabel>
                  <div 
                    id="prompt-hint"
                    className="prompt-form__hint absolute bottom-3 right-3 text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    e.g., "Best marketing agencies in London"
                  </div>
                </div>
              </FormControl>
              <FormMessage 
                id="prompt-error"
                className="prompt-form__error" 
                role="alert"
                aria-live="polite"
              />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="prompt-form__submit w-full"
          size="lg"
          aria-describedby={isLoading ? "loading-status" : undefined}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Running Test...</span>
              <span id="loading-status" className="sr-only">
                Please wait while we run your AI findability test
              </span>
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              Run AI Findability Test
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}