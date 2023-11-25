/* eslint-disable max-lines */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable eslint-comments/no-unused-enable */
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jest/no-commented-out-tests */

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type GraphQLRequest } from '@apollo/server';
import { type GraphQLResponseBody } from './cd-query.resolver.test.js';
import { HttpStatus } from '@nestjs/common';
import { loginGraphQL } from '../login.js';

// eslint-disable-next-line jest/no-export
export type GraphQLQuery = Pick<GraphQLRequest, 'query'>;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    // -------------------------------------------------------------------------
    test('Neue Cd', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isrc: "DEZ123498761",
                            bewertung: 1,
                            genre: ROCK,
                            preis: 99.99,
                            verfuegbar: true,
                            erscheinungsdatum: "2022-02-28",
                            interpret: "Gesangstalent",
                            titel: "Gesangswelt",
                            lieder: [{
                                liedtitel: "Lied 1",
                                laenge: "234"
                            }]
                        }
                    ) {
                        id
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ID
        expect(create).toBeDefined();
        expect(create.id).toBeGreaterThan(0);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('Cd mit ungueltigen Werten neu anlegen', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isrc: "falsche-ISRC!",
                            bewertung: -1,
                            genre: ROCK,
                            preis: -1,
                            verfuegbar: false,
                            erscheinungsdatum: "12345-123-123",
                            interpret: "Tester",
                            titel: "Testsong",
                        }
                    ) {
                        id
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^isrc /u),
            expect.stringMatching(/^bewertung /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^erscheinungsdatum /u),
            // expect.stringMatching(/^interpret /u),
            // expect.stringMatching(/^titel /u),
        ];

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.create).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Neue Cd nur als "admin"/"fachabteilung"', async () => {
        // given
        const token = await loginGraphQL(client, 'adriana.alpha', 'p');
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            isrc: "ITR123333333",
                            bewertung: 1,
                            genre: POP,
                            preis: 11.1,
                            verfuegbar: true,
                            erscheinungsdatum: "1990-12-20",
                            interpret: "Chefsinger",
                            titel: "Abteilungslied",
                        }
                    ) {
                        id
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, extensions } = error;

        expect(message).toBe('Forbidden resource');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    test('CD aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "40",
                            version: 0,
                            isrc: "USW654321987",
                            bewertung: 5,
                            genre: ROCK,
                            preis: 444.44,
                            verfuegbar: false,
                            erscheinungsdatum: "2001-09-20",
                            interpret: "Testchor"
                            titel: "Chorlied",
                        }
                    ) {
                        version
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { update } = data.data!;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update.version).toBe(1);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('Cd mit ungueltigen Werten aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const id = '40';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 0,
                            isrc: "falsche-ISRC",
                            bewertung: -1,
                            genre: POP,
                            preis: -1,
                            verfuegbar: false,
                            erscheinungsdatum: "99999-222-111",
                            interpret: "Tester",
                            titel: "Testlied",
                        }
                    ) {
                        version
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^isrc /u),
            expect.stringMatching(/^bewertung /u),
            expect.stringMatching(/^preis /u),
            expect.stringMatching(/^erscheinungsdatum /u),
            // expect.stringMatching(/^interpret /u),
            // expect.stringMatching(/^titel /u),
        ];

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    // // -------------------------------------------------------------------------

    // test('Nicht-vorhandene Cd aktualisieren', async () => {
    //     // given
    //     const token = await loginGraphQL(client);
    //     const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
    //     const id = '999999';
    //     const body: GraphQLQuery = {
    //         query: `
    //             mutation {
    //                 update(
    //                     input: {
    //                         id: "${id}",
    //                         version: 0,
    //                         isrc: "AUW238822111",
    //                         bewertung: 5,
    //                         genre: ROCK,
    //                         preis: 99.99,
    //                         verfuegbar: false,
    //                         datum: "2010-04-27",
    //                         interpret: "Rocker",
    //                         titel: "RocknRoll",
    //                     }
    //                 ) {
    //                     version
    //                 }
    //             }
    //         `,
    //     };

    //     // when
    //     const response: AxiosResponse<GraphQLResponseBody> = await client.post(
    //         graphqlPath,
    //         body,
    //         { headers: authorization },
    //     );

    //     // then
    //     const { status, headers, data } = response;

    //     expect(status).toBe(HttpStatus.OK);
    //     expect(headers['content-type']).toMatch(/json/iu);
    //     expect(data.data!.update).toBeNull();

    //     const { errors } = data;

    //     expect(errors).toHaveLength(1);

    //     const [error] = errors!;

    //     expect(error).toBeDefined();

    //     const { message, path, extensions } = error;

    //     expect(message).toBe(
    //         `Es gibt keine Cd mit der ID ${id.toLowerCase()}.`,
    //     );
    //     expect(path).toBeDefined();
    //     expect(path!![0]).toBe('update');
    //     expect(extensions).toBeDefined();
    //     expect(extensions!.code).toBe('BAD_USER_INPUT');
    // });
});
/* eslint-enable max-lines, @typescript-eslint/no-extra-non-null-assertion */
