import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { ROLES_KEY } from './roles-allowed.decorator.js';
import { Reflector } from '@nestjs/core';
import { type RequestWithUser } from '../jwt/jwt-auth.guard.js';
import { type Role } from '../service/role.js';
import { UserService } from '../service/user.service.js';
import { getLogger } from '../../../logger/logger.js';

/**
 * Guard für RBAC (= role-based access control), so dass der Decorater
 * `@RolesAllowed()` verwendet werden kann.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    readonly #reflector: Reflector;

    readonly #userService: UserService;

    readonly #logger = getLogger(RolesGuard.name);

    constructor(reflector: Reflector, userService: UserService) {
        this.#reflector = reflector;
        this.#userService = userService;
    }

    /**
     * Die Rollen im Argument des Decorators `@RolesAllowed()` ermitteln.
     * @param context Der Ausführungskontext zur Ermittlung der Metadaten bzw.
     * des Decorators.
     * @return true, falls die Rollen beim Controller oder bei der dekorierten
     * Funktion durch den JWT gegeben sind.
     */
    async canActivate(context: ExecutionContext) {
        const requiredRoles: Role[] | undefined =
            this.#reflector.getAllAndOverride(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
        this.#logger.debug('canActivate: requiredRoles=%o', requiredRoles);
        if (requiredRoles === undefined || requiredRoles.length === 0) {
            return false;
        }

        const request: RequestWithUser = context.switchToHttp().getRequest();
        const requestUser = request.user;
        this.#logger.debug('canActivate: requestUser=%o', requestUser);
        if (requestUser === undefined) {
            return false;
        }

        const { userId } = requestUser;
        const user = await this.#userService.findById(userId);
        this.#logger.debug('canActivate: user=%o', user);

        if (user === undefined) {
            return false;
        }
        return requiredRoles.some((role) => user.roles.includes(role));
    }
}
