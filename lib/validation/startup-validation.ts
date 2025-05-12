interface ValidationResult {
  success: boolean
  errors: string[]
}

interface ModuleCheck {
  name: string
  validate: () => Promise<boolean>
}

const REQUIRED_MODULES: ModuleCheck[] = [
  {
    name: 'LoadingProvider',
    validate: async () => {
      try {
        await import('@/lib/providers/loading-provider')
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'AuthProvider',
    validate: async () => {
      try {
        await import('@/lib/providers/auth-provider')
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'Storage Utils',
    validate: async () => {
      try {
        await import('@/lib/utils/storage')
        return true
      } catch {
        return false
      }
    }
  },
  {
    name: 'UnifiedLayout',
    validate: async () => {
      try {
        await import('@/components/layout/unified-layout')
        return true
      } catch {
        return false
      }
    }
  }
]

export async function validateStartup(): Promise<ValidationResult> {
  const errors: string[] = []
  
  // Check each required module
  for (const module of REQUIRED_MODULES) {
    const isValid = await module.validate()
    if (!isValid) {
      errors.push(`Required module "${module.name}" is missing or invalid`)
    }
  }

  // Check localStorage availability
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
    } catch (error) {
      errors.push('localStorage is not available')
    }
  }

  // Check for development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Running startup validation in development mode')
    console.log('Required modules:', REQUIRED_MODULES.map(m => m.name).join(', '))
    if (errors.length > 0) {
      console.error('Validation errors:', errors)
    } else {
      console.log('All validations passed successfully')
    }
  }

  return {
    success: errors.length === 0,
    errors
  }
} 