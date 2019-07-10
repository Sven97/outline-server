// Copyright 2019 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import {PrometheusClient, QueryResultData} from '../infrastructure/prometheus_scraper';
import {DataUsageByUser} from '../model/metrics';

import {PrometheusManagerMetrics} from './manager_metrics';

describe('PrometheusManagerMetrics', () => {
  it('get30DayByteTransfer', async (done) => {
    const managerMetrics = getManagerMetrics({'access-key-1': 1000, 'access-key-2': 10000});
    const dataUsage = await managerMetrics.get30DayByteTransfer();
    const bytesTransferredByUserId = dataUsage.bytesTransferredByUserId;
    expect(Object.keys(bytesTransferredByUserId).length).toEqual(2);
    expect(bytesTransferredByUserId['access-key-1']).toEqual(1000);
    expect(bytesTransferredByUserId['access-key-2']).toEqual(10000);
    done();
  });

  it('getOutboundByteTransfer', async (done) => {
    const managerMetrics = getManagerMetrics({'access-key': 1024});
    const dataUsage = await managerMetrics.getOutboundByteTransfer('access-key', 10);
    const bytesTransferredByUserId = dataUsage.bytesTransferredByUserId;
    expect(Object.keys(bytesTransferredByUserId).length).toEqual(1);
    expect(bytesTransferredByUserId['access-key']).toEqual(1024);
    done();
  });

  it('getOutboundByteTransfer returns zero when ID is missing', async (done) => {
    const managerMetrics = getManagerMetrics({'access-key': 1024});
    const dataUsage = await managerMetrics.getOutboundByteTransfer('doesnotexist', 10);
    const bytesTransferredByUserId = dataUsage.bytesTransferredByUserId;
    expect(Object.keys(bytesTransferredByUserId).length).toEqual(1);
    expect(bytesTransferredByUserId['doesnotexist']).toEqual(0);
    done();
  });
});

class FakePrometheusClient extends PrometheusClient {
  constructor(private transferredBytesById: {[accessKeyId: string]: number}) {
    super('');
  }

  async query(query: string): Promise<QueryResultData> {
    const queryResultData = {} as QueryResultData;
    queryResultData.result = [];
    for (const accessKeyId of Object.keys(this.transferredBytesById)) {
      const transferredBytes = this.transferredBytesById[accessKeyId];
      queryResultData.result.push(
          {metric: {'access_key': accessKeyId}, value: [transferredBytes, `${transferredBytes}`]});
    }
    return queryResultData;
  }
}

function getManagerMetrics(transferredBytesById: {[accessKeyId: string]: number}) {
  return new PrometheusManagerMetrics(new FakePrometheusClient(transferredBytesById));
}
