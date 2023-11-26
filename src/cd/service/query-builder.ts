/* eslint-disable eslint-comments/disable-enable-pair */
/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Cd } from '../entity/cd.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Lied } from '../entity/lied.entity.js';
import { Repository } from 'typeorm';
import { type Suchkriterien } from './cd-read.service.js';
import { getLogger } from '../../logger/logger.js';

/** Definitionen der Typen für die Suche mit der Cd-ID. */
export interface BuildIdParams {
    readonly id: number;

    readonly mitLiedern?: boolean;
}
/**
 * Die Klasse `QueryBuilder` für das Lesen von bereits vorhandenen Cds.
 */
@Injectable()
export class QueryBuilder {
    readonly #cdAlias = `${Cd.name.charAt(0).toLowerCase()}${Cd.name.slice(1)}`;

    readonly #liedAlias = `${Lied.name
        .charAt(0)
        .toLowerCase()}${Lied.name.slice(1)}`;

    readonly #repo: Repository<Cd>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Cd) repo: Repository<Cd>) {
        this.#repo = repo;
    }

    /**
     * Eine Cd mit der ID suchen.
     * @param id ID der gesuchten Cd
     * @returns QueryBuilder
     */
    buildId({ id, mitLiedern = false }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#cdAlias);
        if (mitLiedern) {
            queryBuilder.leftJoinAndSelect(
                `${this.#cdAlias}.lieder`,
                this.#liedAlias,
            );
        }
        queryBuilder.where(`${this.#cdAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Cds suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    build({ ...props }: Suchkriterien) {
        this.#logger.debug('build: props=%o', props);

        let queryBuilder = this.#repo.createQueryBuilder(this.#cdAlias);

        let useWhere = true;

        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(`${this.#cdAlias}.${key} = :${key}`, param)
                : queryBuilder.andWhere(
                      `${this.#cdAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
