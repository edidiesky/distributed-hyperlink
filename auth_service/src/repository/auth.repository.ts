import { measureDatabaseQuery, trackError } from "../shared/metrics";
import { db } from "../infrastructure/database/client";
import { CreateUserInternalDTO } from "../infrastructure/database/models/dtos/internal.dto";
import { User } from "../infrastructure/database/models/user.model";
import { AppError } from "../shared/errors/AppError";
import logger from "../shared/logger";
import { Pool, QueryResult } from "pg";

export class UserRepository {
  constructor(private pool: Pool = db) {}

  async create(
    userData: CreateUserInternalDTO & { password_hash: string },
  ): Promise<User> {
    return await measureDatabaseQuery(
      "create_user",
      async () => {
        const query = `
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name, is_verified, is_active, created_at, updated_at
    `;

        try {
          const result: QueryResult<User> = await this.pool.query(query, [
            userData.email,
            userData.password_hash,
            userData.first_name,
            userData.last_name,
          ]);

          if (result.rowCount !== 1) {
            throw AppError.internal("Failed to create user - no rows returned");
          }

          const createdUser = result.rows[0];
          logger.info("User has been created successfully", {
            userId: createdUser.id,
            email: userData.email,
          });

          return createdUser;
        } catch (error: any) {
          if (error.code === "23505") {
            trackError("duplicate_email", "create_user", "low");
            throw AppError.conflict(
              "This email already exists with us. Please kindly login rather than registering",
              { email: userData.email },
            );
          }

          if (error.code?.startsWith("5")) {
            trackError("internal_error", "create_user", "low");
            logger.error("Database internal error during user creation", {
              error: error.message,
              code: error.code,
            });
            throw AppError.internal(
              "Failed to create user due to database error",
            );
          }
          logger.error("Unexpected error during user creation", {
            error: error.message,
            stack: error.stack,
          });
          throw AppError.internal(
            "Unexpected error during user creation. Please kindly reach out to our team",
          );
        }
      },
      "user",
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return await measureDatabaseQuery(
      "find_user_by_email",
      async () => {
        const query = `
      SELECT id, email, password_hash, first_name, last_name,
             is_verified, is_active, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

        const result: QueryResult<User> = await this.pool.query(query, [email]);
        logger.info("Returned result for email search:", {
          result,
        });
        return result.rows[0] ?? null;
      },
      "user",
    );
  }

  async findById(id: string): Promise<User | null> {
    return await measureDatabaseQuery(
      "find_user_by_id",
      async () => {
        const query = `
      SELECT id, email, password_hash, first_name, last_name,
             is_verified, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

        const result: QueryResult<User> = await this.pool.query(query, [id]);

        if (result.rowCount === 0) {
          trackError("user_id_not_found", "get_user");
          throw AppError.notFound(`User with id ${id} not found`);
        }

        return result.rows[0];
      },
      "user",
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    return await measureDatabaseQuery(
      "update_Last_login",
      async () => {
        const query = `
      UPDATE users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

        const result = await this.pool.query(query, [userId]);

        if (result.rowCount === 0) {
          throw AppError.notFound(`User with id ${userId} not found`);
        }
      },
      "user",
    );
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    return await measureDatabaseQuery(
      "update_password",
      async () => {
        const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;

        const result = await this.pool.query(query, [passwordHash, userId]);

        if (result.rowCount === 0) {
          throw AppError.notFound(`User with id ${userId} not found`);
        }
      },
      "user",
    );
  }
}
