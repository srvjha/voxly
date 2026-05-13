import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

type Source = "body" | "params" | "query";

type Schemas = Partial<Record<Source, ZodType>>;

export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const source of Object.keys(schemas) as Source[]) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        return res.status(400).json({
          error: "ValidationError",
          source,
          issues: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
            code: i.code,
          })),
        });
      }

      (req as unknown as Record<Source, unknown>)[source] = result.data;
    }
    next();
  };
}
