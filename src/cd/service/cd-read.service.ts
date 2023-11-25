/* eslint-disable eslint-comments/disable-enable-pair */
/**
 * Das Modul besteht aus der Klasse {@linkcode CdReadService}.
 * @packageDocumentation
 */

import { Cd, type CdGenre } from '../entity/cd.entity.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import { getLogger } from '../../logger/logger.js';
import re2 from 're2';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    readonly id: number;
    readonly mitLiedern?: boolean;
}
export interface Suchkriterien {
    readonly isrc?: string;
    readonly bewertung?: number;
    readonly genre?: CdGenre;
    readonly preis?: number;
    readonly verfuegbar?: boolean;
    readonly erscheinungsdatum?: string;
    readonly interpret?: string;
    readonly titel?: string;
}

/**
 * Die Klasse `CdReadService` implementiert das Lesen für Cds und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class CdReadService {
    static readonly ID_PATTERN = new re2('^[1-9][\\d]*$');

    readonly #cdProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(CdReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const cdDummy = new Cd();
        this.#cdProps = Object.getOwnPropertyNames(cdDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Eine Cd asynchron anhand seiner ID suchen
     * @param id ID der gesuchten Cd
     * @returns Die gefundene Cd vom Typ [Cd](cd_entity_cd_entity.Cd.html)
     *          in einem Promise aus ES2015.
     * @throws NotFoundException falls keine Cd mit der ID existiert
     */
    async findById({ id, mitLiedern = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);
        const cd = await this.#queryBuilder
            .buildId({ id, mitLiedern })
            .getOne();
        if (cd === null) {
            throw new NotFoundException(`Es gibt keine Cd mit der ID ${id}.`);
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: cd=%s, titel=%o',
                cd.toString(),
                cd.titel,
            );
            if (mitLiedern) {
                this.#logger.debug('findById: lieder=%o', cd.lieder);
            }
        }
        return cd;
    }

    /**
     * Cds asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Cds.
     * @throws NotFoundException falls keine Cds gefunden wurden.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        const cds = await this.#queryBuilder.build(suchkriterien).getMany();
        this.#logger.debug('find: cds=%o', cds);
        if (cds.length === 0) {
            throw new NotFoundException(
                `Keine Cds gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }

        return cds;
    }

    #checkKeys(keys: string[]) {
        let validKeys = true;
        keys.forEach((key) => {
            if (!this.#cdProps.includes(key)) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
