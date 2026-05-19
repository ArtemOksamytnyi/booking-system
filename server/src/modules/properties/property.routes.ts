import { Router } from 'express'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../middleware/auth'
import { asyncHandler } from '../../utils/async-handler'
import {
  createReviewSchema,
  createRoomSchema,
  createOwnerPropertySchema,
  createPropertySchema,
  listPropertiesSchema,
  propertyAvailabilitySchema,
  reviewPropertyVerificationSchema,
} from './property.schemas'
import {
  createPropertyReview,
  createProperty,
  createPropertyForOwner,
  createRoomForOwner,
  getAvailableRooms,
  getPropertyById,
  listPropertyTypes,
  listProperties,
  reviewPropertyVerification,
} from './property.service'

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
      ownerEmail: req.query.ownerEmail,
    })
    const properties = await listProperties(filters)
    res.json(properties)
  }),
)

propertyRouter.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const propertyTypes = await listPropertyTypes()
    res.json(propertyTypes)
  }),
)

propertyRouter.post(
  '/owner',
  requireAuth,
  requireRole(['hotel_owner', 'admin']),
  asyncHandler(async (req, res) => {
    const input = createOwnerPropertySchema.parse(req.body)
    const property = await createPropertyForOwner((req as AuthenticatedRequest).user!.userId, input)
    res.status(201).json(property)
  }),
)

propertyRouter.post(
  '/:id/rooms',
  requireAuth,
  requireRole(['hotel_owner', 'admin']),
  asyncHandler(async (req, res) => {
    const input = createRoomSchema.parse(req.body)
    const room = await createRoomForOwner(Number(req.params.id), (req as AuthenticatedRequest).user!, input)
    res.status(201).json(room)
  }),
)

propertyRouter.patch(
  '/verification-status',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const input = reviewPropertyVerificationSchema.parse(req.body)
    const property = await reviewPropertyVerification(input)
    res.json(property)
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

propertyRouter.post(
  '/:id/reviews',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createReviewSchema.parse(req.body)
    const review = await createPropertyReview(
      Number(req.params.id),
      (req as AuthenticatedRequest).user!.userId,
      input,
    )

    res.status(201).json(review)
  }),
)

export { propertyRouter }
