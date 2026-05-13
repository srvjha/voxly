import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";



export const pollStatusEnum = pgEnum("poll_status", [
  "draft",
  "active",
  "expired",
  "published",
]);


export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  clerkId:   varchar("clerk_id", { length: 255 }).unique().notNull(),
  email:     varchar("email", { length: 255 }).unique().notNull(),
  name:      varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const polls = pgTable("polls", {
  id:          uuid("id").primaryKey().defaultRandom(),
  creatorId:   uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:       varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status:      pollStatusEnum("status").default("draft").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  expiresAt:   timestamp("expires_at"),
  publishedAt: timestamp("published_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});


export const questions = pgTable("questions", {
  id:          uuid("id").primaryKey().defaultRandom(),
  pollId:      uuid("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  text:        text("text").notNull(),
  isMandatory: boolean("is_mandatory").default(true).notNull(),
  orderIndex:  integer("order_index").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});



export const options = pgTable("options", {
  id:         uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  text:       text("text").notNull(),
  orderIndex: integer("order_index").notNull(),
});


export const pollResponses = pgTable(
  "poll_responses",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    pollId:       uuid("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
    respondentId: uuid("respondent_id").references(() => users.id, { onDelete: "set null" }),
    anonToken:    varchar("anon_token", { length: 255 }),
    ipAddress:    varchar("ip_address", { length: 100 }),
    submittedAt:  timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    uqAuthenticatedResponse: uniqueIndex("uq_authenticated_response")
      .on(table.pollId, table.respondentId)
      .where(sql`respondent_id IS NOT NULL`),
  })
);

export const questionAnswers = pgTable(
  "question_answers",
  {
    id:         uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id").notNull().references(() => pollResponses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    optionId:   uuid("option_id").notNull().references(() => options.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uqOneAnswerPerQuestion: uniqueIndex("uq_one_answer_per_question")
      .on(table.responseId, table.questionId),
  })
);