import 'mocha';
import { assert } from 'chai';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { IContractsLookup, IOriginConfiguration } from '@energyweb/origin-backend-core';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';

import { AppModule } from '../../app.module';

describe('Configuration API tests', () => {
    let app: INestApplication;

    const contractsLookup: IContractsLookup = {
        issuer: '0x123',
        registry: '0x456'
    };

    const standard = 'I-REC';
    const country = {
        name: 'Test Country',
        regions: {
            'North East': ['Random NE Region']
        }
    };
    const currency = 'USD';
    const currency2 = 'EUR';

    before(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule.register(null)]
        }).compile();

        app = moduleRef.createNestApplication();
        app.enableCors();
        app.useWebSocketAdapter(new WsAdapter(app));

        await app.init();
    });

    describe('Configuration', () => {
        it('fails with a 404 when configuration not set', async () => {
            await request(app.getHttpServer())
                .get('/Configuration')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404);
        });

        it('updates the configuration', async () => {
            const configuration: IOriginConfiguration = {
                contractsLookup,
                currencies: [currency, currency2],
                countryName: country.name,
                regions: country.regions,
                complianceStandard: standard
            };

            await request(app.getHttpServer())
                .put('/Configuration')
                .send(configuration)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200);

            await request(app.getHttpServer())
                .get('/Configuration')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(res => {
                    assert.deepOwnInclude(res.body, configuration);
                });
        });
    });

    after(async () => {
        await app.close();
    });
});
