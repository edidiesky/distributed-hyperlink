import { Response, Request } from "express";

export type AuthenticatedRequest = Request & {
  user: {
    role: string;
    userId: string;
    name: string; 
    permissions: Permission[];
    roleLevel?: RoleLevel;
  };
};


export enum RoleLevel {
  SUPER_ADMIN = 1,
  EXECUTIVE = 2,
  DIRECTORATE_HEAD = 3,
  MEMBER = 4,
}

export enum Permission {
  CREATE_USER = "CREATE_USER",
  MANAGE_ROLES = "MANAGE_ROLES",
  READ_USER = "READ_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  VIEW_REPORTS = "VIEW_REPORTS",
}

export interface CreateCategoryInput {
  name: string;
  value: string;
}


export interface IURL {
  _id: string;
  originalUrl: string;
  shortUrl: string;
  urlCode: string;
  clicks: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  env: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  server: {
    port: number;
    apiPrefix: string;
  };
}