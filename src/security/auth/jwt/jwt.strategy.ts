import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type User } from '../service/user.service.js';
import { getLogger } from '../../../logger/logger.js';
import { jwtConfig } from '../../../config/jwt.js';

const { algorithm, publicKey } = jwtConfig;

/**
 * Payload für einen JWT.
 */
export interface Payload {
    readonly sub: number;
    readonly username: string;
}

export type BasicUser = Pick<User, 'userId' | 'username'>;

/**
 * Mit `JwtStrategy` wird im Konstruktor verifziert, wie ein JWT verifiziert
 * wird.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    readonly #logger = getLogger(JwtStrategy.name);

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: publicKey,
            algorithms: [algorithm],
            ignoreExpiration: false,
        });
    }

    /**
     * Validierung des JWT-Tokens. Dabei wird `userId` und `username` aus der
     * Payload des Tokens extrahiert und zurückgegeben, damit dieses JSON-Objekt
     * in `JwtAuthGuard.handleRequest()` und in `JwtAuthGraphQlGuard.handleRequest()`
     * im Request-Objekt gepuffert werden kann.
     * @param payload des Tokens als JSON-Objekt mit z.B. "username", "sub" usw.
     * @returns JSON-Objekt mit `userId` und `username` für `JwtAuthGuard.handleRequest()`
     *  und `JwtAuthGraphQlGuard.handleRequest()`.
     */
    validate(payload: Payload) {
        this.#logger.debug('validate: payload=%o', payload);
        const user: BasicUser = {
            userId: payload.sub,
            username: payload.username,
        };
        this.#logger.debug('validate: user=%o', user);
        return user;
    }
}
