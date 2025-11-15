-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('conservative', 'moderate', 'aggressive');

-- CreateEnum
CREATE TYPE "LearningPreference" AS ENUM ('visual', 'text', 'interactive', 'mixed');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('finley', 'ava');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "primary_goal" TEXT,
    "risk_level" "RiskLevel",
    "learning_preference" "LearningPreference",
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(12,2),
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_date" DATE,
    "category" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "ai_completion_probability" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(12,2),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "due_date" DATE,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "lesson_title" TEXT NOT NULL,
    "category" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(5,2),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" DATE,
    "total_lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "agent_type" "AgentType" NOT NULL,
    "message" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_user_id_lesson_id_key" ON "learning_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
