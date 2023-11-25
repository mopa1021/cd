/* eslint-disable eslint-comments/disable-enable-pair */
/**
 * Das Modul besteht aus der Klasse {@linkcode CdWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import {
    IsrcExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { Cd } from '../entity/cd.entity.js';
import { CdReadService } from './cd-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import RE2 from 're2';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';

export interface UpdateParams {
    readonly id: number | undefined;

    readonly cd: Cd;

    readonly version: string;
}

/**
 * Die Klasse `CdWriteService` implementiert den Anwendungskern für das
 * Schreiben von Cds und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class CdWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Cd>;

    readonly #readService: CdReadService;

    readonly #logger = getLogger(CdWriteService.name);

    constructor(
        @InjectRepository(Cd) repo: Repository<Cd>,
        readService: CdReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    }

    /**
     * Eine neue Cd soll angelegt werden.
     * @param cd Die neu abzulegende Cd
     * @returns Die ID der neu angelegten Cd
     * @throws IsrcExists falls die ISRC-Nummer bereits existiert
     */
    async create(cd: Cd): Promise<number> {
        this.#logger.debug('create: cd=%o', cd);
        await this.#validateCreate(cd);

        const cdDb = await this.#repo.save(cd);
        this.#logger.debug('create: cdDb=%o', cdDb);

        return cdDb.id!;
    }

    /**
     * Eine vorhandene Cd soll aktualisiert werden.
     * @param cd Die zu aktualisierende Cd
     * @param id ID der zu aktualisierenden Cd
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * @throws VersionInvalidException falls die Versionsnummer ungültig ist
     * @throws VersionOutdatedException falls die Versionsnummer veraltet ist
     */
    async update({ id, cd, version }: UpdateParams): Promise<number> {
        this.#logger.debug('update: id=%d, cd=%o, version=%s', id, cd, version);
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt keine Cd mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(cd, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Cd)) {
            return validateResult;
        }

        const cdNeu = validateResult;
        const merged = this.#repo.merge(cdNeu, cd);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    async #validateCreate(cd: Cd): Promise<undefined> {
        this.#logger.debug('#validateCreate: cd=%o', cd);

        const { isrc } = cd;
        try {
            await this.#readService.find({ isrc: isrc }); // eslint-disable-line object-shorthand
        } catch (err) {
            if (err instanceof NotFoundException) {
                return;
            }
        }
        throw new IsrcExistsException(isrc);
    }

    async #validateUpdate(cd: Cd, id: number, versionStr: string): Promise<Cd> {
        const version = this.#validateVersion(versionStr);
        this.#logger.debug('#validateUpdate: cd=%o, version=%s', cd, version);

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): number {
        this.#logger.debug('#validateVersion: version=%s', version);
        if (
            version === undefined ||
            !CdWriteService.VERSION_PATTERN.test(version)
        ) {
            throw new VersionInvalidException(version);
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(id: number, version: number): Promise<Cd> {
        const cdDb = await this.#readService.findById({ id });

        const versionDb = cdDb.version!;
        if (version < versionDb) {
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%d',
                version,
            );
            throw new VersionOutdatedException(version);
        }

        return cdDb;
    }
}
