import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormField,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const promptSchema = z.object({
  templateId: z.string().min(1, 'Template is required'),
  variables: z.record(z.string()),
  customInstructions: z.string().optional(),
});

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: Array<{
    name: string;
    description: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
  }>;
}

interface PromptBuilderProps {
  templates: PromptTemplate[];
  onSubmit: (values: z.infer<typeof promptSchema>) => void;
}

export function PromptBuilder({ templates, onSubmit }: PromptBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<PromptTemplate | null>(null);
  const [preview, setPreview] = React.useState<string>('');

  const form = useForm<z.infer<typeof promptSchema>>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      templateId: '',
      variables: {},
      customInstructions: '',
    },
  });

  // Extract the complex expression to a variable
  const formValues = form.getValues();
  const selectedPromptType = formValues.promptType;

  React.useEffect(() => {
    if (selectedPromptType) {
      form.setValue('prompt', getDefaultPrompt(selectedPromptType));
    }
  }, [selectedPromptType, form]);

  React.useEffect(() => {
    if (selectedTemplate) {
      let previewText = selectedTemplate.template;
      const variables = form.getValues('variables');
      
      Object.entries(variables).forEach(([key, value]) => {
        previewText = previewText.replace(`{${key}}`, value || `{${key}}`);
      });

      const customInstructions = form.getValues('customInstructions');
      if (customInstructions) {
        previewText += `\n\nAdditional Instructions:\n${customInstructions}`;
      }

      setPreview(previewText);
    }
  }, [form.watch(), selectedTemplate]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setValue('templateId', templateId);
      
      // Initialize variables
      const variables: Record<string, string> = {};
      template.variables.forEach(v => {
        variables[v.name] = '';
      });
      form.setValue('variables', variables);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField name="templateId" render={({ field }) => (
              <div className="form-item">
                <label className="form-label">Prompt Template</label>
                <div className="form-control">
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTemplateChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </Select>
                </div>
                <p className="form-description">
                  {selectedTemplate?.description}
                </p>
              </div>
            )} />

            {selectedTemplate && (
              <div className="space-y-4">
                {selectedTemplate.variables.map((variable) => (
                  <FormField
                    key={variable.name}
                    name={`variables.${variable.name}`}
                    render={({ field }) => (
                      <div className="form-item">
                        <label className="form-label">{variable.name}</label>
                        {variable.type === 'select' ? (
                          <div className="form-control">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${variable.name}`} />
                              </SelectTrigger>
                            </Select>
                          </div>
                        ) : (
                          <div className="form-control">
                            <Input
                              {...field}
                              type={variable.type === 'number' ? 'number' : 'text'}
                              placeholder={variable.description}
                            />
                          </div>
                        )}
                        <p className="form-description">{variable.description}</p>
                      </div>
                    )}
                  />
                ))}

                <FormField
                  name="customInstructions"
                  render={({ field }) => (
                    <div className="form-item">
                      <label className="form-label">Additional Instructions</label>
                      <div className="form-control">
                        <Textarea
                          {...field}
                          placeholder="Add any custom instructions or modifications..."
                        />
                      </div>
                      <p className="form-description">
                        Optional: Add specific instructions to customize the prompt
                      </p>
                    </div>
                  )}
                />
              </div>
            )}

            <Button type="submit">Generate Prompt</Button>
          </form>
        </Form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Preview</CardTitle>
          {selectedTemplate && (
            <div className="flex gap-2">
              <Badge variant="outline">Template: {selectedTemplate.name}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {preview || 'Select a template and fill in variables to see preview'}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 