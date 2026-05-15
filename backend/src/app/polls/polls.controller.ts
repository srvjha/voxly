import type { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/api-error.js";
import ApiResponse from "../../utils/api-response.js";
import * as service from "./polls.service.js";
import type {
  CreatePollInput,
  SubmitResponseInput,
  UpdatePollInput,
} from "./polls.schema.js";

function requireDbUser(req: Request) {
  if (!req.dbUser) throw ApiError.unauthorized();
  return req.dbUser;
}

export async function createPoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const poll = await service.createPoll(user.id, req.body as CreatePollInput);
    return ApiResponse.created({ res, message: "Poll created", data: { poll } });
  } catch (err) {
    next(err);
  }
}

export async function listMyPolls(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const polls = await service.listMyPolls(user.id);
    return ApiResponse.ok({ res, message: "Polls loaded", data: { polls } });
  } catch (err) {
    next(err);
  }
}

export async function listParticipatedPolls(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const polls = await service.listParticipatedPolls(user.id);
    return ApiResponse.ok({
      res,
      message: "Participated polls loaded",
      data: { polls },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params as { id: string };
    const viewerId = req.dbUser?.id ?? null;
    const poll = await service.getPoll(id, viewerId);
    return ApiResponse.ok({ res, message: "Poll loaded", data: { poll } });
  } catch (err) {
    next(err);
  }
}

export async function updatePoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const { id } = req.params as { id: string };
    const poll = await service.updatePoll(
      id,
      user.id,
      req.body as UpdatePollInput,
    );
    return ApiResponse.ok({ res, message: "Poll updated", data: { poll } });
  } catch (err) {
    next(err);
  }
}

export async function activatePoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const { id } = req.params as { id: string };
    const poll = await service.activatePoll(id, user.id);
    return ApiResponse.ok({ res, message: "Poll activated", data: { poll } });
  } catch (err) {
    next(err);
  }
}

export async function publishPoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const { id } = req.params as { id: string };
    const poll = await service.publishPoll(id, user.id);
    return ApiResponse.ok({ res, message: "Poll published", data: { poll } });
  } catch (err) {
    next(err);
  }
}

export async function deletePoll(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const { id } = req.params as { id: string };
    await service.deletePoll(id, user.id);
    return ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function submitResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params as { id: string };
    const viewer = req.dbUser ? { id: req.dbUser.id } : null;
    const ip = req.ip ?? null;
    const response = await service.submitResponse(
      id,
      req.body as SubmitResponseInput,
      viewer,
      ip,
    );
    return ApiResponse.created({
      res,
      message: "Response submitted",
      data: { response },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireDbUser(req);
    const { id } = req.params as { id: string };
    const analytics = await service.getAnalytics(id, user.id);
    return ApiResponse.ok({
      res,
      message: "Analytics loaded",
      data: { analytics },
    });
  } catch (err) {
    next(err);
  }
}
