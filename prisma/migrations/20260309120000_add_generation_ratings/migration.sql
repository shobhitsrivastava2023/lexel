-- CreateTable
CREATE TABLE "GenerationRating" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "naturalness" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "intelligibility" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationRating_generationId_idx" ON "GenerationRating"("generationId");

-- CreateIndex
CREATE INDEX "GenerationRating_orgId_idx" ON "GenerationRating"("orgId");

-- CreateIndex
CREATE INDEX "GenerationRating_userId_idx" ON "GenerationRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationRating_generationId_userId_key" ON "GenerationRating"("generationId", "userId");

-- AddForeignKey
ALTER TABLE "GenerationRating" ADD CONSTRAINT "GenerationRating_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
