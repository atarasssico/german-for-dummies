import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Home } from '@/routes/Home'
import { NotFound } from '@/routes/NotFound'
import { Paradigm } from '@/routes/Paradigm'
import { Reference } from '@/routes/Reference'
import { SettingsPage } from '@/routes/Settings'
import { Session } from '@/routes/Session'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ueben/:mode" element={<Session />} />
        <Route path="/paradigma" element={<Paradigm />} />
        <Route path="/paradigma/:verbId" element={<Paradigm />} />
        <Route path="/tabellen" element={<Reference />} />
        <Route path="/einstellungen" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}
