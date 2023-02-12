import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class XataApi implements ICredentialType {
	name = 'xataApi';
	displayName = 'Xata API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

}
