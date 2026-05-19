import { app } from './app'
import { env } from './config/env'
import { syncExpiredBookings } from './modules/bookings/booking.service'

async function startServer() {
  await syncExpiredBookings()

  app.listen(env.PORT, () => {
    console.log(`LankaStay API listening on http://localhost:${env.PORT}`)
  })
}

void startServer()
