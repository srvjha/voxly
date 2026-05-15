import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../../http-error.js";
import * as service from "./polls.service.js";
import type {
  CreatePollInput,
  SubmitResponseInput,
  UpdatePollInput,
} from "./polls.schema.js";

function requireDbUser(req: Request) {
  if (!req.dbUser) throw new HttpError(401, "Unauthenticated");
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
    res.status(201).json({ poll });
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
    res.json({ polls });
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
    res.json({ polls });
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
    res.json({ poll });
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
    res.json({ poll });
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
    res.json({ poll });
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
    res.json({ poll });
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
    res.status(204).send();
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
    res.status(201).json({ response });
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
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}
