import { Header } from '@/components/layout/header'
import { UniverseBuilder } from './universe-builder'

export default function NewTargetUniversePage() {
  return (
    <>
      <Header title="New Target Universe" subtitle="Define your search strategy before AI qualification begins" />
      <UniverseBuilder />
    </>
  )
}
