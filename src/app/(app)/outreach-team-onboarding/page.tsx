import { Header } from '@/components/layout/header'
import { OnboardingClient } from './onboarding-client'

export default function OnboardingPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Outreach Team Onboarding"
        subtitle="Getting started with the SHMA Growth Engine"
      />
      <div className="flex-1 overflow-auto">
        <OnboardingClient />
      </div>
    </div>
  )
}
