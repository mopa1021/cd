import { AuthModule } from '../security/auth/auth.module.js';
import { CdGetController } from './rest/cd-get.controller.js';
import { CdMutationResolver } from './graphql/cd-mutation.resolver.js';
import { CdQueryResolver } from './graphql/cd-query.resolver.js';
import { CdReadService } from './service/cd-read.service.js';
import { CdWriteController } from './rest/cd-write.controller.js';
import { CdWriteService } from './service/cd-write.service.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { QueryBuilder } from './service/query-builder.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';

/**
 * Das Modul beinhaltet alle Controller- und Service-Klassen für die Cds.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit den Controller- und Service-Klassen für Cds.
 */
@Module({
    imports: [MailModule, TypeOrmModule.forFeature(entities), AuthModule],
    controllers: [CdGetController, CdWriteController],
    providers: [
        CdReadService,
        CdWriteService,
        CdQueryResolver,
        CdMutationResolver,
        QueryBuilder,
    ],
    exports: [CdReadService, CdWriteService],
})
export class CdModule {}
