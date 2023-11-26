/* eslint-disable max-classes-per-file */
/*
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    IsArray,
    IsBoolean,
    IsISO8601,
    IsISRC,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type CdGenre } from '../entity/cd.entity.js';
import { LiedDTO } from './liedDTO.entity.js';
import { Type } from 'class-transformer';

export const MAX_BEWERTUNG = 5;

/**
 * Entity-Klasse für Cds.
 */
export class CdDtoOhneRef {
    @IsISRC()
    @ApiProperty({ example: 'NWO776655312', type: String })
    readonly isrc!: string;

    @IsInt()
    @Min(0)
    @Max(MAX_BEWERTUNG)
    @ApiProperty({ example: 5, type: Number })
    readonly bewertung: number | undefined;

    @Matches(/^POP$|^ROCK$/u)
    @IsOptional()
    @ApiProperty({ example: 'ROCK', type: String })
    readonly genre: CdGenre | undefined;

    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly preis!: number;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly verfuegbar: boolean | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly erscheinungsdatum: Date | string | undefined;

    @IsOptional()
    @ApiProperty({ example: 'Herr Gesang', type: String })
    readonly interpret!: string;

    @IsOptional()
    @ApiProperty({ example: 'RocknRoll', type: String })
    readonly titel!: string;
}

/**
 * Entity-Klasse für Cds ohne TypeORM.
 */
export class CdDTO extends CdDtoOhneRef {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LiedDTO)
    @ApiProperty({ type: [LiedDTO] })
    readonly lieder: LiedDTO[] | undefined;
}
/* eslint-enable max-classes-per-file */
