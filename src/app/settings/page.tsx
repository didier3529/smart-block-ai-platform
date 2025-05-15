import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to the dashboard Settings page
  redirect('/dashboard/settings')
  
  // This is necessary to satisfy TypeScript but will never be executed
  return null
} 