import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'

import { TestAdminPage } from '../../../pages/TestAdminPage'
import { TestBookingPage } from '../../../pages/TestBookingPage'

type TabKey = 'booking' | 'admin'

export function TestTabs() {
  const [tab, setTab] = useState<TabKey>('booking')

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v: TabKey) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="booking" label="test-booking" />
        <Tab value="admin" label="test-admin" />
      </Tabs>

      {tab === 'booking' && <TestBookingPage />}
      {tab === 'admin' && <TestAdminPage />}
    </Box>
  )
}
