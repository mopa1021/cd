/**
 * Das Modul ist für die Behandlung der möglichen Fehler in GraphQL.
 * @packageDocumentation
 */

import { GraphQLError } from 'graphql';
/**
 * Die Error-Klasse für GraphQL.
 * Rückgabe ist `BAD_USER_INPUT` in einem Response.
 */
export class BadUserInputError extends GraphQLError {
    constructor(message: string, exception?: Error) {
        super(message, {
            originalError: exception,
            extensions: {
                code: 'BAD_USER_INPUT',
            },
        });
    }
}
