import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.53.0', 1793195872788)
export class DropDeletedAtFromAgentIndexesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Soft-deleted agents are already hidden; without the filter they would come back live
    await queryRunner.query(
      'DELETE FROM "core"."agent" WHERE "deletedAt" IS NOT NULL',
    );
    await queryRunner.query('DROP INDEX "core"."IDX_AGENT_ID_DELETED_AT"');
    await queryRunner.query(
      'DROP INDEX "core"."IDX_AGENT_NAME_WORKSPACE_ID_UNIQUE"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_AGENT_NAME_WORKSPACE_ID_UNIQUE" ON "core"."agent" ("name", "workspaceId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "core"."IDX_AGENT_NAME_WORKSPACE_ID_UNIQUE"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_AGENT_NAME_WORKSPACE_ID_UNIQUE" ON "core"."agent" ("name", "workspaceId") WHERE "deletedAt" IS NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_AGENT_ID_DELETED_AT" ON "core"."agent" ("id", "deletedAt")',
    );
  }
}
