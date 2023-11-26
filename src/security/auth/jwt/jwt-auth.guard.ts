import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type BasicUser } from './jwt.strategy.js';
import { type Request } from 'express';
import { getLogger } from '../../../logger/logger.js';

export type RequestWithUser = Request & { user?: BasicUser };

/**
 * Das Guard stellt sicher, dass bei einem Request an der REST-Schnittstelle ein
 * gültiger JWT verwendet wird, d.h. dass der/die Endbenutzer/in sich in der
 * Vergangenheit eingeloggt und einen Token erhalten hat, der jetzt im Header
 * "Authorization" mitgeschickt wird. Der Token wird mit der konfigurierten
 * Strategie verifiziert und das zugehörige User-Objekt wird im Request-Objekt
 * gespeichert, damit in `RolesGuard` die Rollen bzw. Zugriffsrechte überprüft
 * werden, wenn in einem Controller @RolesAllowed() verwendet wird.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    readonly #logger = getLogger(JwtAuthGuard.name);

    /**
     * Die geerbte Methode wird überschrieben, damit das User-Objekt aus
     * `JwtStrategy.validate()` im Request-Objekt gespeichert wird.
     * @param _err wird nicht benutzt
     * @param user das User-Objekt, das durch `JwtStrategy.validate()`
     *             aus der Payload ermittelt wurde.
     * @param _info wird nicht benutzt
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird
     */
    // eslint-disable-next-line max-params
    override handleRequest(
        _err: unknown,
        user: any, // type-coverage:ignore-line
        _info: unknown,
        context: ExecutionContext,
    ) {
        this.#logger.debug('handleRequest: user=%o', user); // type-coverage:ignore-line
        const request: RequestWithUser = context.switchToHttp().getRequest();
        request.user = user as BasicUser;
        // type-coverage:ignore-next-line
        return user; // eslint-disable-line @typescript-eslint/no-unsafe-return
    }
}
