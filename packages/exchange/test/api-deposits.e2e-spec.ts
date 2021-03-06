import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Account } from '../src/pods/account/account';
import { AccountService } from '../src/pods/account/account.service';
import { TransferService } from '../src/pods/transfer/transfer.service';
import { DatabaseService } from './database.service';
import { bootstrapTestInstance } from './exchange';

describe('account deposit confirmation', () => {
    let app: INestApplication;
    let transferService: TransferService;
    let databaseService: DatabaseService;
    let accountService: AccountService;

    const user1Id = '1';
    const user2Id = '2';

    const dummyAsset = {
        address: '0x9876',
        tokenId: '0',
        deviceId: '0',
        generationFrom: new Date('2020-01-01'),
        generationTo: new Date('2020-01-31')
    };

    const transactionHash = `0x${((Math.random() * 0xffffff) << 0).toString(16)}`;

    let user1Address: string;

    const createDeposit = (address: string, amount = '1000', asset = dummyAsset) => {
        return transferService.createDeposit({
            address,
            transactionHash,
            amount,
            asset
        });
    };

    const confirmDeposit = () => {
        return transferService.setAsConfirmed(transactionHash, 10000);
    };

    beforeAll(async () => {
        ({ transferService, accountService, databaseService, app } = await bootstrapTestInstance());

        await app.init();

        const { address } = await accountService.getOrCreateAccount(user1Id);
        user1Address = address;
    });

    afterAll(async () => {
        await databaseService.cleanUp();
        await app.close();
    });

    it('should not list unconfirmed deposit', async () => {
        const { address } = await accountService.getOrCreateAccount(user1Id);

        await createDeposit(address);

        await request(app.getHttpServer())
            .get('/account')
            .expect(200)
            .expect(res => {
                const account = res.body as Account;

                expect(account.address).toBe(user1Address);
                expect(account.balances.available.length).toBe(0);
            });
    });

    it('should list confirmed deposit', async () => {
        const amount = '1000';
        const { address } = await accountService.getOrCreateAccount(user2Id);

        await createDeposit(address, amount);
        await confirmDeposit();

        await request(app.getHttpServer())
            .get('/account')
            .expect(200)
            .expect(res => {
                const account = res.body as Account;

                expect(account.address).toBe(user1Address);
                expect(account.balances.available.length).toBe(1);
                expect(account.balances.available[0].amount).toEqual(amount);

                expect(account.balances.available[0].asset).toMatchObject(
                    JSON.parse(JSON.stringify(dummyAsset))
                );
            });
    });
});
