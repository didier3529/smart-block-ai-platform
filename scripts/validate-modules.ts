import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

const CRITICAL_MODULES = [
  '@/lib/providers/loading-provider',
  '@/lib/providers/auth-provider',
  '@/lib/utils/storage',
  '@/components/layout/unified-layout',
]

interface ValidationError {
  file: string
  import: string
  line: number
  message: string
}

async function validateModules() {
  const errors: ValidationError[] = []
  
  // Find all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}')
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    try {
      // Parse the file
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      })
      
      // Check imports
      traverse(ast, {
        ImportDeclaration(path) {
          const importSource = path.node.source.value
          
          // Check if this is a critical module import
          if (CRITICAL_MODULES.includes(importSource)) {
            // Verify the module exists
            const modulePath = importSource.replace('@/', 'src/')
            const fullPath = path.resolve(process.cwd(), `${modulePath}.ts`)
            const fullPathTsx = path.resolve(process.cwd(), `${modulePath}.tsx`)
            
            if (!fs.existsSync(fullPath) && !fs.existsSync(fullPathTsx)) {
              errors.push({
                file,
                import: importSource,
                line: path.node.loc?.start.line || 0,
                message: `Critical module "${importSource}" not found`
              })
            }
          }
        }
      })
    } catch (error) {
      console.error(`Error parsing ${file}:`, error)
    }
  }
  
  // Report errors
  if (errors.length > 0) {
    console.error('\nModule Resolution Validation Errors:')
    errors.forEach(error => {
      console.error(`\n${error.file}:${error.line}`)
      console.error(`  Error: ${error.message}`)
      console.error(`  Import: ${error.import}`)
    })
    process.exit(1)
  } else {
    console.log('\n✓ All critical modules validated successfully')
  }
}

validateModules().catch(error => {
  console.error('Validation script error:', error)
  process.exit(1)
}) 