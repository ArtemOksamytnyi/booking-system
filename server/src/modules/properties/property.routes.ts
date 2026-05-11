import { Router } from 'express'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import { createPropertySchema, listPropertiesSchema, propertyAvailabilitySchema } from './property.schemas'
import { createProperty, getAvailableRooms, getPropertyById, listProperties } from './property.service'

const propertyRouter = Router()

propertyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = listPropertiesSchema.parse({
      search: req.query.search,
      category: req.query.category,
      city: req.query.city,
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut,
      guests: req.query.guests,
    })
    const properties = await listProperties(filters)
    res.json(properties)
  }),
)

propertyRouter.post(
  '/',
  requireAuth,
  requireRole(['hotel_owner', 'admin']),
  asyncHandler(async (req, res) => {
    const input = createPropertySchema.parse(req.body)
    const property = await createProperty((req as AuthenticatedRequest).user!.userId, input)
    res.status(201).json(property)
  }),
)

propertyRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const property = await getPropertyById(Number(req.params.id))
    res.json(property)
  }),
)

propertyRouter.get(
  '/:id/available-rooms',
  asyncHandler(async (req, res) => {
    const query = propertyAvailabilitySchema.parse({
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut,
      guests: req.query.guests,
    })

    const result = await getAvailableRooms(
      Number(req.params.id),
      new Date(`${query.checkIn}T00:00:00.000Z`),
      new Date(`${query.checkOut}T00:00:00.000Z`),
      query.guests,
    )

    res.json(result)
  }),
)

export { propertyRouter }
