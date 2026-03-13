import { createTRPCRouter } from '../init';
import { billingRouter } from './billing';
import { generationsRouter } from './generations';
import { ratingsRouter } from './ratings';
import { voicesRouter } from './voices';
export const appRouter = createTRPCRouter({
  voices: voicesRouter,
  generations: generationsRouter,
  billing: billingRouter,
  ratings: ratingsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
