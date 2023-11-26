import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type CdModel } from '../../src/cd/rest/cd-get.controller.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Cd zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const response: AxiosResponse<CdModel> = await client.get(url);

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        expect(selfLink).toMatchSnapshot();
    });
});
