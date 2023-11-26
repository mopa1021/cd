import {
    DocumentBuilder,
    type SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
// relativer Import
import { AppModule } from './app.module.js';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { corsOptions } from './config/cors.options.js';
import { helmetHandlers } from './security/http/helmet.handler.js';
import { nodeConfig } from './config/node.js';
import { paths } from './config/paths.js';

const { httpsOptions, port } = nodeConfig;

const setupSwagger = (app: INestApplication) => {
    const config = new DocumentBuilder()
        .setTitle('Cd')
        .setDescription('Beispiel für Software Engineering')
        .setVersion('2023.10.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const options: SwaggerCustomOptions = {
        customSiteTitle: 'SWE 23/24',
    };
    SwaggerModule.setup(paths.swagger, app, document, options);
};

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule, { httpsOptions });
    app.use(helmetHandlers, compression());

    app.useGlobalPipes(new ValidationPipe());

    setupSwagger(app);

    app.enableCors(corsOptions);

    await app.listen(port);
};

await bootstrap();

// IIFE  = Immediately Invoked Function Expression
// IIAFE = Immediately Invoked Asynchronous Function Expression
// (async () => {
//     await bootstrap(); // ab ES 2017
// })();

// Promise mit then() ab ES 2015
// bootstrap()
//     .then(() => console.log(`Server gestartet auf Port ${port}`)) // eslint-disable-line security-node/detect-crlf
//     .catch((err) => console.error('Fehler bei bootstrap():', err));
