import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { MigrateLambdaDependencyLayersToV1Command } from 'src/database/commands/upgrade-version-command/2-54/2-54-workspace-command-1793209651736-migrate-lambda-dependency-layers-to-v1.command';
import { CoreEntityCacheModule } from 'src/engine/core-entity-cache/core-entity-cache.module';
import { ApplicationPackageModule } from 'src/engine/core-modules/application/application-package/application-package.module';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { SdkClientModule } from 'src/engine/core-modules/sdk-client/sdk-client.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [
    ApplicationModule,
    ApplicationPackageModule,
    CacheLockModule,
    CoreEntityCacheModule,
    SdkClientModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
  ],
  providers: [MigrateLambdaDependencyLayersToV1Command],
})
export class V2_54_UpgradeVersionCommandModule {}
