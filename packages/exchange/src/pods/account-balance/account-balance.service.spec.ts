import { OrderSide } from '@energyweb/exchange-core';
import { Test, TestingModule } from '@nestjs/testing';
import BN from 'bn.js';

import { Asset } from '../asset/asset.entity';
import { Order } from '../order/order.entity';
import { OrderService } from '../order/order.service';
import { Trade } from '../trade/trade.entity';
import { TradeService } from '../trade/trade.service';
import { TransferDirection } from '../transfer/transfer-direction';
import { Transfer } from '../transfer/transfer.entity';
import { TransferService } from '../transfer/transfer.service';
import { AccountBalanceService } from './account-balance.service';

jest.mock('../trade/trade.service');
jest.mock('../transfer/transfer.service');
jest.mock('../order/order.service');

describe('AccountBalanceService', () => {
    const userId = '1';
    const asset1 = { id: '1', address: '0x1234', tokenId: '0' } as Asset;
    const asset2 = { id: '2', address: '0x1234', tokenId: '1' } as Asset;

    let service: AccountBalanceService;
    let tradeService: TradeService;
    let transferService: TransferService;
    let orderService: OrderService;

    const registerTransfer = (...transfers: Partial<Transfer>[]) => {
        jest.spyOn(transferService, 'getAllCompleted').mockImplementation(
            async () => transfers as Transfer[]
        );
    };

    const registerTrade = (...trades: Partial<Trade>[]) => {
        jest.spyOn(tradeService, 'getAll').mockImplementation(async () => trades as Trade[]);
    };

    const registerOrder = (...orders: Partial<Order>[]) => {
        jest.spyOn(orderService, 'getActiveOrdersBySide').mockImplementation(
            async () => orders as Order[]
        );
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountBalanceService, TradeService, TransferService, OrderService]
        }).compile();

        service = module.get<AccountBalanceService>(AccountBalanceService);
        tradeService = module.get<TradeService>(TradeService);
        transferService = module.get<TransferService>(TransferService);
        orderService = module.get<OrderService>(OrderService);

        registerTransfer();
        registerTrade();
        registerOrder();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return deposits as available', async () => {
        registerTransfer(
            { asset: asset1, amount: '1000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '2000', direction: TransferDirection.Deposit }
        );

        const res = await service.getAccountBalance('1');

        expect(res.available.length).toBe(2);

        expect(res.available[0].amount).toEqual(new BN('1000'));
        expect(res.available[0].asset).toEqual(asset1);

        expect(res.available[1].amount).toEqual(new BN('2000'));
        expect(res.available[1].asset).toEqual(asset2);
    });

    it('should return sum of deposits as available', async () => {
        registerTransfer(
            { asset: asset1, amount: '1000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '2000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '3000', direction: TransferDirection.Deposit }
        );

        const res = await service.getAccountBalance('1');

        expect(res.available.length).toBe(2);

        expect(res.available[0].amount).toEqual(new BN('1000'));
        expect(res.available[0].asset).toEqual(asset1);

        expect(res.available[1].amount).toEqual(new BN('5000'));
        expect(res.available[1].asset).toEqual(asset2);
    });

    it('should return sum of deposits and trades as available', async () => {
        registerTransfer(
            { asset: asset1, amount: '1000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '2000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '3000', direction: TransferDirection.Deposit }
        );

        registerTrade(
            { ask: { asset: asset1, userId } as Order, volume: new BN(500) },
            { ask: { asset: asset2 } as Order, bid: { userId } as Order, volume: new BN(1000) }
        );

        const res = await service.getAccountBalance(userId);

        const expectedAsset1Amount = 1000 - 500;
        const expectedAsset2Amount = 2000 + 3000 + 1000;

        expect(res.available.length).toBe(2);

        expect(res.available[0].amount).toEqual(new BN(expectedAsset1Amount));
        expect(res.available[0].asset).toEqual(asset1);

        expect(res.available[1].amount).toEqual(new BN(expectedAsset2Amount));
        expect(res.available[1].asset).toEqual(asset2);
    });

    it('should return sum of deposits, trades and active sell orders as available for single asset', async () => {
        registerTransfer({ asset: asset1, amount: '1000', direction: TransferDirection.Deposit });

        registerTrade({ ask: { asset: asset1, userId } as Order, volume: new BN(500) });

        registerOrder({ asset: asset1, side: OrderSide.Ask, currentVolume: new BN(100) });

        const res = await service.getAccountBalance(userId);

        const expectedAsset1Amount = 1000 - 500 - 100;

        expect(res.available.length).toBe(1);

        expect(res.available[0].amount).toEqual(new BN(expectedAsset1Amount));
        expect(res.available[0].asset).toEqual(asset1);
    });

    it('should return sum of deposits, trades and active sell orders as available for multiple assets', async () => {
        registerTransfer(
            { asset: asset1, amount: '1000', direction: TransferDirection.Deposit },
            { asset: asset1, amount: '500', direction: TransferDirection.Withdrawal },
            { asset: asset2, amount: '2000', direction: TransferDirection.Deposit },
            { asset: asset2, amount: '1000', direction: TransferDirection.Withdrawal }
        );

        registerTrade(
            { ask: { asset: asset1, userId } as Order, volume: new BN(400) },
            { ask: { asset: asset2, userId } as Order, volume: new BN(1000) }
        );

        registerOrder({ asset: asset1, side: OrderSide.Ask, currentVolume: new BN(100) });

        const res = await service.getAccountBalance(userId);

        const expectedAsset1Amount = 1000 - 500 - 400 - 100;
        const expectedAsset2Amount = 2000 - 1000 - 1000;

        expect(res.available.length).toBe(2);

        expect(res.available[0].amount).toEqual(new BN(expectedAsset1Amount));
        expect(res.available[0].asset).toEqual(asset1);

        expect(res.available[1].amount).toEqual(new BN(expectedAsset2Amount));
        expect(res.available[1].asset).toEqual(asset2);
    });
});
