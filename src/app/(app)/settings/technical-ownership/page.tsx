import { Header } from '@/components/layout/header'
import { TechnicalOwnershipClient } from './technical-ownership-client'

export default function TechnicalOwnershipPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Technical Ownership Checklist"
        subtitle="System health, maintenance tasks, and ownership responsibilities"
        backHref="/settings"
        backLabel="Settings"
      />
      <div className="flex-1 overflow-auto">
        <TechnicalOwnershipClient />
      </div>
    </div>
  )
}
