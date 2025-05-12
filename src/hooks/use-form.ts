import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
};

type FormConfig<T extends Record<string, any>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

type FormState<T extends Record<string, any>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
};

export function useForm<T extends Record<string, any>>(config: FormConfig<T>) {
  const initialValues = Object.entries(config).reduce((acc, [key, field]) => {
    acc[key as keyof T] = field.initialValue;
    return acc;
  }, {} as T);

  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  });

  const validateField = useCallback((name: keyof T, value: T[keyof T]) => {
    const fieldConfig = config[name];
    if (!fieldConfig.rules) return '';

    for (const rule of fieldConfig.rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return '';
  }, [config]);

  const validateForm = useCallback(() => {
    const errors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(config).forEach((key) => {
      const error = validateField(key as keyof T, formState.values[key as keyof T]);
      if (error) {
        errors[key as keyof T] = error;
        isValid = false;
      }
    });

    return { errors, isValid };
  }, [config, formState.values, validateField]);

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setFormState((prev) => {
      const error = validateField(name, value);
      const newValues = { ...prev.values, [name]: value };
      const { errors, isValid } = validateForm();

      return {
        ...prev,
        values: newValues,
        errors: { ...errors, [name]: error },
        touched: { ...prev.touched, [name]: true },
        isValid,
        isDirty: true,
      };
    });
  }, [validateField, validateForm]);

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      const { errors, isValid } = validateForm();

      setFormState((prev) => ({
        ...prev,
        errors,
        isValid,
        touched: Object.keys(config).reduce((acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        }, {} as Record<keyof T, boolean>),
      }));

      if (isValid) {
        onSubmit(formState.values);
      }
    };
  }, [config, formState.values, validateForm]);

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    setFieldValue,
    handleSubmit,
    resetForm,
  };
}

// Example validation rules
export const rules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message,
  }),
  minLength: (length: number, message = `Minimum length is ${length}`): ValidationRule<string | any[]> => ({
    validate: (value) => value.length >= length,
    message,
  }),
  maxLength: (length: number, message = `Maximum length is ${length}`): ValidationRule<string | any[]> => ({
    validate: (value) => value.length <= length,
    message,
  }),
  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),
}; 