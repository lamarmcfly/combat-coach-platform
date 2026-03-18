import { NextRequest, NextResponse } from "next/server";
import { ApiError, ValidationError } from "./errors";
import * as Sentry from "@sentry/nextjs";

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        const body: Record<string, unknown> = {
          error: error.message,
          code: error.code,
        };

        if (error instanceof ValidationError && error.errors) {
          body.errors = error.errors;
        }

        return NextResponse.json(body, { status: error.statusCode });
      }

      // Unknown error — log to Sentry and return 500
      console.error("Unhandled API error:", error);
      Sentry.captureException(error);

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 },
      );
    }
  };
}
