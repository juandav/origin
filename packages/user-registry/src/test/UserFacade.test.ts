import Web3 from 'web3';
import 'mocha';
import dotenv from 'dotenv';
import { assert } from 'chai';

import { Configuration } from '@energyweb/utils-general';
import { OffChainDataSourceMock } from '@energyweb/origin-backend-client-mocks';

import { UserLogic, User } from '..';
import { migrateUserRegistryContracts } from '../utils/migrateContracts';

import { logger } from '../blockchain-facade/Logger';
import { buildRights, Role } from '../wrappedContracts/RoleManagement';

describe('User Facade', () => {
    dotenv.config({
        path: '.env.test'
    });

    const web3: Web3 = new Web3(process.env.WEB3);
    const deployKey: string = process.env.DEPLOY_KEY;

    const privateKeyDeployment = deployKey.startsWith('0x') ? deployKey : `0x${deployKey}`;

    let userLogic: UserLogic;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;
    let conf: Configuration.Entity;

    const user1PK = '0xd9bc30dc17023fbb68fe3002e0ff9107b241544fd6d60863081c55e383f1b5a3';
    const user1 = web3.eth.accounts.privateKeyToAccount(user1PK).address;

    const user2PK = '0xc4b87d68ea2b91f9d3de3fcb77c299ad962f006ffb8711900cb93d94afec3dc3';
    const user2 = web3.eth.accounts.privateKeyToAccount(user2PK).address;

    const RIGHTS = buildRights([Role.Trader, Role.DeviceManager]);

    it('should deploy the contracts', async () => {
        userLogic = await migrateUserRegistryContracts(web3, privateKeyDeployment);

        assert.exists(userLogic);
    });

    it('should create a user', async () => {
        const userPropsOnChain: User.IUserOnChainProperties = {
            url: null,
            propertiesDocumentHash: null,
            id: user1,
            active: true,
            roles: RIGHTS
        };

        const userPropsOffChain: User.IUserOffChainProperties = {
            dummy: true
        };

        conf = {
            blockchainProperties: {
                web3,
                userLogicInstance: userLogic,
                activeUser: {
                    address: accountDeployment,
                    privateKey: privateKeyDeployment
                }
            },
            offChainDataSource: new OffChainDataSourceMock(),
            logger
        };

        await User.createUser(userPropsOnChain, userPropsOffChain, conf);

        const user = await new User.Entity(user1, conf).sync();

        assert.ownInclude(user, {
            id: user1.toLowerCase(),
            roles: RIGHTS,
            active: true,
            initialized: true
        } as Partial<User.Entity>);

        assert.ownInclude(user.offChainProperties, userPropsOffChain);
    });

    it('isRole should work correctly', async () => {
        const user = await new User.Entity(user1, conf).sync();

        assert.ok(user.isRole(Role.DeviceManager));
        assert.ok(user.isRole(Role.Trader));
        assert.notOk(user.isRole(Role.Issuer));
        assert.notOk(user.isRole(Role.DeviceAdmin));
        assert.notOk(user.isRole(Role.Matcher));
        assert.notOk(user.isRole(Role.UserAdmin));
    });

    it('Should get offChainProperties correctly', async () => {
        const user = await new User.Entity(user1, conf).sync();

        assert.deepEqual(user.offChainProperties, {
            dummy: true
        });
    });

    it('Should update offChainProperties correctly', async () => {
        let user = await new User.Entity(user1, conf).sync();

        assert.ownInclude(user.offChainProperties, {
            dummy: true
        });

        conf.blockchainProperties.activeUser = {
            address: user1,
            privateKey: user1PK
        };

        const newProperties = {
            dummy: false
        };

        await user.update(newProperties);

        user = await user.sync();

        assert.ownInclude(user.offChainProperties, {
            dummy: false
        });
    });
});
