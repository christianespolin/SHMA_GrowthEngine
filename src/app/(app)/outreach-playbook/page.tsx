import { Header } from '@/components/layout/header'
import { OutreachPlaybookClient } from './outreach-playbook-client'

export default function OutreachPlaybookPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Outreach Playbook"
        subtitle="SHMA message styles, process guide, and best practice"
      />
      <div className="flex-1 overflow-auto">
        <OutreachPlaybookClient />
      </div>
    </div>
  )
}
