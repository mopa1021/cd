/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Lied ohne TypeORM.
 */
export class LiedDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Gutes Beispiellied', type: String })
    readonly liedtitel!: string;

    @MaxLength(16)
    @ApiProperty({ example: '119', type: String })
    readonly laenge!: string;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
