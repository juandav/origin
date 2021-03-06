import {
    IOffChainDataSource,
    IPreciseProofClient,
    IConfigurationClient,
    IUserClient,
    IDeviceClient,
    IRequestClient,
    RequestClient,
    IOrganizationClient,
    IEventClient,
    IFilesClient,
    ICertificateClient
} from '@energyweb/origin-backend-client';

import { PreciseProofClientMock } from './PreciseProofClientMock';
import { ConfigurationClientMock } from './ConfigurationClientMock';
import { UserClientMock } from './UserClientMock';
import { DeviceClientMock } from './DeviceClientMock';
import { OrganizationClientMock } from './OrganizationClientMock';
import { EventClientMock } from './EventClientMock';
import { CertificateClientMock } from './CertificateClientMock';

export class OffChainDataSourceMock implements IOffChainDataSource {
    dataApiUrl: string;

    preciseProofClient: IPreciseProofClient = new PreciseProofClientMock();

    configurationClient: IConfigurationClient = new ConfigurationClientMock();

    userClient: IUserClient = new UserClientMock();

    eventClient: IEventClient = new EventClientMock();

    deviceClient: IDeviceClient;

    organizationClient: IOrganizationClient;

    requestClient: IRequestClient = new RequestClient();

    filesClient: IFilesClient;

    certificateClient: ICertificateClient = new CertificateClientMock();

    constructor() {
        this.eventClient.start();

        this.deviceClient = new DeviceClientMock(this.eventClient);
        this.organizationClient = new OrganizationClientMock(this.eventClient);
    }
}
