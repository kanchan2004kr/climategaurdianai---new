-- AlterEnum
BEGIN;
CREATE TYPE "CitizenReportStatus_new" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESOLVED');
ALTER TABLE "public"."CitizenReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CitizenReport" ALTER COLUMN "status" TYPE "CitizenReportStatus_new" USING ("status"::text::"CitizenReportStatus_new");
ALTER TYPE "CitizenReportStatus" RENAME TO "CitizenReportStatus_old";
ALTER TYPE "CitizenReportStatus_new" RENAME TO "CitizenReportStatus";
DROP TYPE "public"."CitizenReportStatus_old";
ALTER TABLE "CitizenReport" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;
-- AlterEnum
BEGIN;
CREATE TYPE "CitizenReportType_new" AS ENUM ('FLOODING', 'EXTREME_HEAT', 'SEVERE_POLLUTION', 'WATER_SHORTAGE', 'WILDFIRE_SMOKE', 'UNSAFE_WATER', 'INFRASTRUCTURE_DAMAGE', 'OTHER');
ALTER TABLE "CitizenReport" ALTER COLUMN "type" TYPE "CitizenReportType_new" USING ("type"::text::"CitizenReportType_new");
ALTER TYPE "CitizenReportType" RENAME TO "CitizenReportType_old";
ALTER TYPE "CitizenReportType_new" RENAME TO "CitizenReportType";
DROP TYPE "public"."CitizenReportType_old";
COMMIT;
-- AlterTable
ALTER TABLE "CitizenReport" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO';
-- AddForeignKey
ALTER TABLE "CitizenReport" ADD CONSTRAINT "CitizenReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
