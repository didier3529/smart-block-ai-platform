import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Agent, AgentConfig } from '@/types/agents';

const configSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(8192),
  enableStreaming: z.boolean(),
  responseFormat: z.enum(['json', 'text', 'markdown']),
  customPromptTemplate: z.string().optional(),
});

interface AgentConfigurationProps {
  agent: Agent;
  onSave: (config: AgentConfig) => void;
}

export function AgentConfiguration({ agent, onSave }: AgentConfigurationProps) {
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      modelName: agent.config.modelName,
      temperature: agent.config.temperature,
      maxTokens: agent.config.maxTokens,
      enableStreaming: agent.config.enableStreaming,
      responseFormat: agent.config.responseFormat,
      customPromptTemplate: agent.config.customPromptTemplate,
    },
  });

  function onSubmit(values: z.infer<typeof configSchema>) {
    onSave(values as AgentConfig);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="modelName" render={({ field }) => (
          <div className="form-item">
            <label className="form-label">Model</label>
            <div className="form-control">
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
              </Select>
            </div>
            <p className="form-description">
              Select the AI model to use for this agent
            </p>
          </div>
        )} />

        <FormField name="temperature" render={({ field }) => (
          <div className="form-item">
            <label className="form-label">Temperature</label>
            <div className="form-control">
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                />
                <div className="text-sm text-muted-foreground">
                  Current: {field.value}
                </div>
              </div>
            </div>
            <p className="form-description">
              Controls randomness in responses (0 = deterministic, 1 = creative)
            </p>
          </div>
        )} />

        <FormField name="maxTokens" render={({ field }) => (
          <div className="form-item">
            <label className="form-label">Max Tokens</label>
            <div className="form-control">
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </div>
            <p className="form-description">
              Maximum number of tokens in the response
            </p>
          </div>
        )} />

        <FormField name="enableStreaming" render={({ field }) => (
          <div className="form-item flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label className="form-label">Enable Streaming</label>
              <p className="form-description">
                Receive responses in real-time as they're generated
              </p>
            </div>
            <div className="form-control">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          </div>
        )} />

        <FormField name="responseFormat" render={({ field }) => (
          <div className="form-item">
            <label className="form-label">Response Format</label>
            <div className="form-control">
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
              </Select>
            </div>
            <p className="form-description">
              Choose how the agent should format its responses
            </p>
          </div>
        )} />

        <FormField name="customPromptTemplate" render={({ field }) => (
          <div className="form-item">
            <label className="form-label">Custom Prompt Template</label>
            <div className="form-control">
              <Input {...field} />
            </div>
            <p className="form-description">
              Optional: Provide a custom prompt template
            </p>
          </div>
        )} />

        <Button type="submit">Save Configuration</Button>
      </form>
    </Form>
  );
} 