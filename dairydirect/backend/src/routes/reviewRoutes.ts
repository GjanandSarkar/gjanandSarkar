import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { optionalAuthenticate } from '../middleware/auth';

export const reviewRoutes = Router();

reviewRoutes.get('/', reviewController.getReviews);
reviewRoutes.post('/', optionalAuthenticate, reviewController.addReview);
reviewRoutes.post('/:id/helpful', reviewController.markHelpful);
