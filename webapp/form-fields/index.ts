import { Attribute } from '@theniledev/react';

import * as DbFields from './DB';
import * as SkyNet from './SkyNet';
import * as Banking from './Banking';
import * as Workload from './Workload';

type Fields = {
  fields: Attribute[];
  columns: string[];
  instanceName: string;
};
export const getFormFields = (entity: string): void | Fields => {
  if (entity === 'DB') {
    return DbFields;
  }
  if (entity === 'SkyNet') {
    return SkyNet;
  }
  if (entity === 'Banking') {
    return Banking;
  }
  if (entity === 'Workload') {
    return Workload;
  }
};
