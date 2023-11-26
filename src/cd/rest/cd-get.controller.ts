/* eslint-disable eslint-comments/disable-enable-pair */
/**
 * Das Modul der Get-Controller-Klasse zum Lesen mit REST.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { type Cd, type CdGenre } from '../entity/cd.entity.js';
import {
    CdReadService,
    type Suchkriterien,
} from '../service/cd-read.service.js';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    readonly href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    readonly self: Link;
    /** Optionaler Linke für list */
    readonly list?: Link;
    /** Optionaler Linke für add */
    readonly add?: Link;
    /** Optionaler Linke für update */
    readonly update?: Link;
    /** Optionaler Linke für remove */
    readonly remove?: Link;
}

/** Cd-Objekt mit HATEOAS-Links */
export type CdModel = Omit<
    Cd,
    'lieder' | 'aktualisiert' | 'erzeugt' | 'id' | 'version'
> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Cd-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface CdsModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        cds: CdModel[];
    };
}

/**
 * Klasse für `CdGetController`, damit man über Swagger Queries erzeugen und abschicken kann.
 */
export class CdQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly isrc: string;

    @ApiProperty({ required: false })
    declare readonly bewertung: number;

    @ApiProperty({ required: false })
    declare readonly genre: CdGenre;

    @ApiProperty({ required: false })
    declare readonly preis: number;

    @ApiProperty({ required: false })
    declare readonly verfuegbar: boolean;

    @ApiProperty({ required: false })
    declare readonly erscheinungsdatum: string;

    @ApiProperty({ required: false })
    declare readonly interpret: string;

    @ApiProperty({ required: false })
    declare readonly titel: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

/**
 * Controller-Klasse zum Suchen von Cds.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Cd REST-API')
export class CdGetController {
    readonly #service: CdReadService;

    readonly #logger = getLogger(CdGetController.name);

    constructor(service: CdReadService) {
        this.#service = service;
    }

    /**
     * Damit man eine Cd anhand ihrer ID suchen kann.
     *
     * `If-None-Match` ist im Header des Requests enthalten.
     * Wenn keine Cd mit der eingegebenen ID gefunden wird, wird der Statuscode
     * 404 zurückgegeben.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Cd-ID' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Die Cd wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Keine Cd zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Die Cd wurde bereits heruntergeladen',
    })
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<CdModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s"', idStr, version);
        const id = Number(idStr);
        if (Number.isNaN(id)) {
            this.#logger.debug('getById: NaN');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const cd = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById(): cd=%s', cd.toString());
            this.#logger.debug('getById(): titel=%o', cd.titel);
        }

        const versionDb = cd.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        const cdModel = this.#toModel(cd, req);
        this.#logger.debug('getById: cdModel=%o', cdModel);
        return res.contentType(APPLICATION_HAL_JSON).json(cdModel);
    }

    /**
     * Suche mit Query-Parametern nach Cds.
     * Wenn keine Suckriterien eingegeben werden, dann werden alle
     * vorhandenen Cds gefunden.
     * Wenn keine Cd mit den eingegebenen Suckriterien gefunden wird, der Statuscode
     * 404 zurückgegeben. Falls aber mindestens eine Cd gefunden wird, dann
     * wird der Statuscode 200 zurückgegeben.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine möglicherweise leere Cd-Liste' })
    async get(
        @Query() query: CdQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<CdsModel | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const cds = await this.#service.find(query);
        this.#logger.debug('get: %o', cds);

        const cdsModel = cds.map((cd) => this.#toModel(cd, req, false));
        this.#logger.debug('get: cdsModel=%o', cdsModel);

        const result: CdsModel = { _embedded: { cds: cdsModel } };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(cd: Cd, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = cd;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: cd=%o, links=%o', cd, links);
        /* eslint-disable unicorn/consistent-destructuring */
        const cdModel: CdModel = {
            isrc: cd.isrc,
            bewertung: cd.bewertung,
            genre: cd.genre,
            preis: cd.preis,
            verfuegbar: cd.verfuegbar,
            erscheinungsdatum: cd.erscheinungsdatum,
            interpret: cd.interpret,
            titel: cd.titel,
            _links: links,
        };
        /* eslint-enable unicorn/consistent-destructuring */

        return cdModel;
    }
}
