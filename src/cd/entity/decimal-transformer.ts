/**
 * Das Modul der Transformer-Klasse der Property preis des Moduls Cd.
 * @packageDocumentation
 */

import { type ValueTransformer } from 'typeorm';
export class DecimalTransformer implements ValueTransformer {
    /**
     * Fall: Schreiben in die DB
     */
    to(decimal?: number): string | undefined {
        return decimal?.toString();
    }

    /**
     * Fall: Lesen aus der DB
     */
    from(decimal?: string): number | undefined {
        return decimal === undefined ? undefined : Number(decimal);
    }
}
