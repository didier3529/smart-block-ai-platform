import { ProcessingStep } from '../types/processing';
import { AgentResponse } from '../types/agents';

export const commonSteps = {
  formatJsonStep: {
    name: 'formatJson',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      if (typeof response.data === 'string') {
        try {
          response.data = JSON.parse(response.data);
        } catch (error) {
          // If not valid JSON, leave as is
        }
      }
      return response;
    }
  } as ProcessingStep,

  validateNumbersStep: {
    name: 'validateNumbers',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      const validateObject = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && !isNaN(Number(obj[key]))) {
            obj[key] = Number(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            validateObject(obj[key]);
          }
        }
      };

      if (typeof response.data === 'object') {
        validateObject(response.data);
      }
      return response;
    }
  } as ProcessingStep,

  addTimestampStep: {
    name: 'addTimestamp',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      response.metadata = {
        ...response.metadata,
        processedAt: Date.now()
      };
      return response;
    }
  } as ProcessingStep,

  sanitizeHtmlStep: {
    name: 'sanitizeHtml',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
          // Basic HTML sanitization - remove tags
          return value.replace(/<[^>]*>/g, '');
        }
        if (Array.isArray(value)) {
          return value.map(sanitizeValue);
        }
        if (typeof value === 'object' && value !== null) {
          const sanitized: any = {};
          for (const key in value) {
            sanitized[key] = sanitizeValue(value[key]);
          }
          return sanitized;
        }
        return value;
      };

      response.data = sanitizeValue(response.data);
      return response;
    }
  } as ProcessingStep,

  validateSchemaStep: (schema: any) => ({
    name: 'validateSchema',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      // Basic schema validation
      const validateSchema = (data: any, schema: any): boolean => {
        if (schema === null || schema === undefined) {
          return true;
        }
        if (typeof schema !== typeof data) {
          return false;
        }
        if (Array.isArray(schema)) {
          if (!Array.isArray(data)) {
            return false;
          }
          return data.every(item => validateSchema(item, schema[0]));
        }
        if (typeof schema === 'object') {
          return Object.keys(schema).every(key => 
            validateSchema(data?.[key], schema[key])
          );
        }
        return true;
      };

      if (!validateSchema(response.data, schema)) {
        throw new Error('Response data does not match schema');
      }
      return response;
    }
  }) as (schema: any) => ProcessingStep,

  deduplicateStep: {
    name: 'deduplicate',
    process: async (response: AgentResponse): Promise<AgentResponse> => {
      const deduplicateArray = (arr: any[]): any[] => {
        return Array.from(new Set(arr));
      };

      const deduplicateObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return deduplicateArray(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
          const result: any = {};
          for (const key in obj) {
            result[key] = deduplicateObject(obj[key]);
          }
          return result;
        }
        return obj;
      };

      response.data = deduplicateObject(response.data);
      return response;
    }
  } as ProcessingStep
};

export const truncateLongTextStep: ProcessingStep<AgentResponse> = {
  name: 'truncate-long-text',
  process: async (input) => {
    const maxLength = 1000; // Configurable
    if (typeof input.data === 'string' && input.data.length > maxLength) {
      return {
        ...input,
        data: input.data.substring(0, maxLength) + '...',
        metadata: {
          ...input.metadata,
          truncated: true,
          originalLength: input.data.length
        }
      };
    }
    return input;
  }
};

export const validateResponseStructureStep: ProcessingStep<AgentResponse> = {
  name: 'validate-structure',
  validate: async (input) => {
    return (
      input &&
      typeof input === 'object' &&
      'data' in input &&
      'metadata' in input &&
      typeof input.metadata === 'object'
    );
  },
  process: async (input) => input,
  onError: async (error, input) => {
    console.error('Response structure validation failed:', error);
    throw new Error('Invalid response structure');
  }
}; 