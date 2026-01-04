import { NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

type ValidationResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: NextResponse };

/**
 * Validate request body against a Zod schema
 * Returns a structured result with either the parsed data or an error response
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: formattedErrors,
          },
          { status: 400 }
        ),
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to parse request' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: formattedErrors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to parse query parameters' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Simple validation function that throws on error
 * Use when you want to handle errors manually
 */
export function validate<T>(data: unknown, schema: ZodSchema<T>): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns a result object
 */
export function safeValidate<T>(
  data: unknown,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
