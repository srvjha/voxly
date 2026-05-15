import { Router } from "express";
import type { Router as RouterType } from "express";
import { validate } from "../../validation.js";
import { loadDbUser, loadOptionalDbUser } from "../auth/auth.middleware.js";
import { writeLimiter, submitResponseLimiter } from "../../middleware/index.js";
import * as ctrl from "./polls.controller.js";
import {
  createPollBody,
  pollIdParam,
  submitResponseBody,
  updatePollBody,
} from "./polls.schema.js";

const router: RouterType = Router();

router.post("/", writeLimiter, validate({ body: createPollBody }), loadDbUser, ctrl.createPoll);
router.get("/", loadDbUser, ctrl.listMyPolls);
router.get("/participated", loadDbUser, ctrl.listParticipatedPolls);

router.get(
  "/:id",
  validate({ params: pollIdParam }),
  loadOptionalDbUser,
  ctrl.getPoll,
);

router.patch(
  "/:id",
  writeLimiter,
  validate({ params: pollIdParam, body: updatePollBody }),
  loadDbUser,
  ctrl.updatePoll,
);

router.post(
  "/:id/activate",
  writeLimiter,
  validate({ params: pollIdParam }),
  loadDbUser,
  ctrl.activatePoll,
);

router.post(
  "/:id/publish",
  writeLimiter,
  validate({ params: pollIdParam }),
  loadDbUser,
  ctrl.publishPoll,
);

router.delete(
  "/:id",
  writeLimiter,
  validate({ params: pollIdParam }),
  loadDbUser,
  ctrl.deletePoll,
);

router.post(
  "/:id/responses",
  submitResponseLimiter,
  validate({ params: pollIdParam, body: submitResponseBody }),
  loadOptionalDbUser,
  ctrl.submitResponse,
);

router.get(
  "/:id/analytics",
  validate({ params: pollIdParam }),
  loadDbUser,
  ctrl.getAnalytics,
);

export default router;
