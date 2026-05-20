import { app } from './app'
import { env } from './config/env'
import { syncBookingPaymentAutomation, syncExpiredBookings } from './modules/bookings/booking.service'
import { syncDueReminders } from './modules/reminders/reminder.service'

async function startServer() {
  await syncExpiredBookings()
  await syncBookingPaymentAutomation()
  await syncDueReminders()

  app.listen(env.PORT, () => {
    console.log(`LankaStay API listening on http://localhost:${env.PORT}`)
  })
}

void startServer()
