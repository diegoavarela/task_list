import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, integer, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, users } from './tenants';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#64748b'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const categories: any = pgTable('categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#64748b'),
  description: text('description'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#64748b'),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const tasks: any = pgTable('tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  notes: text('notes'),
  companyId: uuid('company_id').references(() => companies.id),
  categoryId: uuid('category_id').references(() => categories.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // high, medium, low
  status: varchar('status', { length: 50 }).notNull().default('todo'), // todo, in_progress, completed, cancelled
  completed: boolean('completed').notNull().default(false),
  dueDate: date('due_date'),
  dueTime: varchar('due_time', { length: 8 }), // HH:MM:SS format
  completedAt: timestamp('completed_at'),
  parentTaskId: uuid('parent_task_id'),
  order: integer('order').default(0),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringPattern: jsonb('recurring_pattern'), // {type: 'daily', interval: 1, endDate: '2024-12-31'}
  isTemplate: boolean('is_template').notNull().default(false),
  templateName: varchar('template_name', { length: 255 }),
  attachments: jsonb('attachments').default([]), // [{id, name, url, size, type}]
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const taskTags = pgTable('task_tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  dependsOnTaskId: uuid('depends_on_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const taskComments: any = pgTable('task_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentCommentId: uuid('parent_comment_id'),
  mentions: jsonb('mentions').default([]), // [userId1, userId2]
  attachments: jsonb('attachments').default([]),
  isEdited: boolean('is_edited').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const taskTimeEntries = pgTable('task_time_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in minutes
  isRunning: boolean('is_running').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});