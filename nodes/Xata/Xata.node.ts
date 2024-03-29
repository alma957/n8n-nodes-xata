import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { getAdditionalOptions, getItem, xataApiList, xataApiRequest } from './GenericFunctions';

export class Xata implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Xata',
		name: 'xata',
		icon: 'file:xata.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume Xata API',
		defaults: {
			name: 'Xata',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'xataApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Append',
						value: 'append',
						description: 'Append records to a table',
						action: 'Append records to a table',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record with ID',
						action: 'Create record in a table',
					},
					{
						name: 'Create or Update',
						value: 'upsert',
						description: 'Create a new record with ID, or update the current one if it already exists (upsert)',
						action: 'Upsert record in a table',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record from a table',
						action: 'Delete records from a table',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List records from a table',
						action: 'List records from a table',
					},
					{
						name: 'Read',
						value: 'read',
						description: 'Read a record from a table',
						action: 'Read a record from a table',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record in a table',
						action: 'Update a record in a table',
					},
				],
				default: 'append',
			},
			// Node properties which the user gets displayed and
			// can change on the node.

			//-------------------------
			//         All
			//-------------------------
			{
				displayName: 'Workspace Slug',
				name: 'slug',
				type: 'string',
				default: '',
				required: true,
				description: 'The Slug of your workspace',
			},
			{
				displayName: 'Database Location',
				name: 'location',
				type: 'options',
				description: 'The location of the database you want to access',
				options: [
					{
						name: 'us-east-1',
						value: 'us-east-1',
					},
					{
						name: 'us-west-2',
						value: 'us-west-2',
					},
					{
						name: 'eu-west-1',
						value: 'eu-west-1',
					},
				],
				default: 'eu-west-1',
			},
			{
				displayName: 'Database Name',
				name: 'database',
				type: 'string',
				default: '',
				required: true,
				description: 'The Database you want to access',
			},
			{
				displayName: 'Branch Name',
				name: 'branch',
				type: 'string',
				default: '',
				required: true,
				description: 'The Branch you want to access',
			},
			{
				displayName: 'Table Name',
				name: 'table',
				type: 'string',
				default: '',
				required: true,
				description: 'The Table you want to access',
			},
			//-------------------------
			//         Append
			//-------------------------
			//-------------------------
			//         Create
			//-------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to create',
			},
			//-------------------------
			//        delete
			//-------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to delete',
			},
			//-------------------------
			//         List
			//-------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['list'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 200,
				},
				default: 20,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: {},
				description: 'Filter records and choose the columns to return',
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Columns',
						name: 'columns',
						type: 'string',
						typeOptions: {
							multipleValueButtonText: 'Add Column',
							multipleValues: true,
						},
						default: [],
						placeholder: 'Name',
						description:
							'Only data for columns whose names are in this list will be included in the records',
					},
					{
						displayName: 'Filter (JSON) as String',
						name: 'filter',
						type: 'string',
						default: '',
						placeholder: '',
						description:
							'Filter (JSON) as specified in the Xata API (the filter property is already set). If you use expressions make sure you stringify the arguments.',
					},
					{
						displayName: 'Sort (JSON) as String',
						name: 'sort',
						type: 'string',
						default: '',
						placeholder: '',
						description:
							'Sort (JSON) as specified in the Xata API (the sort property is already set). If you use expressions make sure you stringify the arguments.',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 800,
						},
						displayOptions: {
							show: {
								'/returnAll': [false],
							},
						},
						default: 0,
						description: 'Number of matching records to skip',
					},

					{
						displayName: 'Size',
						name: 'size',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 200,
						},
						default: 20,
						description: 'Number of results to return per page',
						displayOptions: {
							show: {
								'/returnAll': [true],
							},
						},
					},
				],
			},
			//-------------------------
			//         Read
			//-------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['read'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to return',
			},

			{
				displayName: 'Pull All Columns',
				name: 'pullAllColumns',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['read'],
					},
				},
				default: true,
				description: "Whether set to true it returns all the record's columns",
			},

			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				typeOptions: {
					multipleValueButtonText: 'Add Column',
					multipleValues: true,
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['read'],
						pullAllColumns: [false],
					},
				},
				placeholder: 'Name',
				description:
					'Only data for columns whose names are in this list will be included in the record',
			},
			//-------------------------
			//        update
			//-------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to update',
			},
			//-------------------------
			//        upsert
			//-------------------------
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['upsert'],
					},
				},
				default: '',
				required: true,
				description: 'ID of the record to create or update',
			},
			//-------------------------
			//        update + upsert + append + create
			//-------------------------
			{
				displayName: 'Send All Columns',
				name: 'sendAllColumns',
				type: 'boolean',
				default: true,

				description: 'Whether to send all the columns to Xata',
				displayOptions: {
					show: {
						operation: ['append', 'update','upsert','create'],
					},
				},
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				typeOptions: {
					multipleValueButtonText: 'Add Column',
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['append', 'update','upsert', 'create'],
						sendAllColumns: [false],
					},
				},

				default: [],
				placeholder: 'Name',
				description: 'Columns in this list will be pushed to the table',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['append', 'update','upsert','create'],
					},
				},
				default: {},
				placeholder: 'Add option',
				options: [
					{
						displayName: 'Ignore Columns',
						name: 'ignoreColumns',
						type: 'string',
						typeOptions: {
							multipleValueButtonText: 'Add Column',
							multipleValues: true,
						},
						displayOptions: {
							show: {
								'/operation': ['append', 'update','upsert','create'],
								'/sendAllColumns': [true],
							},
						},

						default: [],
						placeholder: 'Name',
						description: 'Columns in this list will be not pushed to the table',
					},
					{
						displayName: 'Bulk Size',
						name: 'bulkSize',
						description: 'Number of records to process at once',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 10,
						displayOptions: {
							show: {
								'/operation': ['append'],
							},
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('xataApi');

		if (credentials === undefined) {
			throw new NodeOperationError(this.getNode(), 'No credentials provided for Xata Api');
		}

		const apiKey = credentials.apiKey as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const slug = this.getNodeParameter('slug', 0) as string;
		const database = this.getNodeParameter('database', 0) as string;
		const location = (this.getNodeParameter('location', 0) as string)

			.trim()
			.toLowerCase()
			.replace(/\s/g, '-') as string;
		const branch = this.getNodeParameter('branch', 0) as string;
		const table = this.getNodeParameter('table', 0) as string;
		const baseUrl = `https://${slug}.${location}.xata.sh/db/${database}:${branch}/tables/${table}/`;
		const returnData: IDataObject[] = [];

		if (operation === 'append') {
			const additionalOptions = this.getNodeParameter('additionalOptions', 0) as IDataObject;
			const bulkSize: number = additionalOptions['bulkSize']
				? (additionalOptions['bulkSize'] as number)
				: items.length;
			const sendAllColumns = this.getNodeParameter('sendAllColumns', 0) as boolean;
			const records = [];
			const endpoint = baseUrl + 'bulk';
			for (let i = 0; i < items.length; i++) {
				try {
					const item = getItem.call(this, i, items[i].json, sendAllColumns);
					records.push(item);

					if (records.length === bulkSize || i === items.length - 1) {
						const responseData = await xataApiRequest.call(this, apiKey, 'POST', endpoint, {
							records: records,
						});
						responseData['recordIDs'].forEach((el: string) => returnData.push({ id: el }));
						records.length = 0;
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					} else {
						throw error;
					}
				}
			}
		} else if (operation === 'delete') {
			for (let i = 0; i < items.length; i++) {
				try {
					const id = this.getNodeParameter('id', i) as string;
					const endpoint = (baseUrl + `data/${id}`) as string;
					const responseData = await xataApiRequest.call(
						this,
						apiKey,
						'DELETE',
						endpoint,
						{},
						{ returnFullResponse: true },
					);
					const statusCode = responseData['statusCode'];

					if (statusCode !== 204) {
						throw Error(`${responseData.message}, ID: ${id} StatusCode: ${statusCode}`);
					}
					returnData.push({ recordId: id, respondeData: responseData });
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					} else {
						throw error;
					}
				}
			}
		} else if (operation === 'list') {
			try {
				const body = getAdditionalOptions.call(
					this,
					this.getNodeParameter('additionalOptions', 0, {}) as IDataObject,
				) as IDataObject;
				const endpoint = baseUrl + 'query';
				const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
				const responseData = await xataApiList.call(
					this,
					apiKey,
					'POST',
					endpoint,
					body,
					returnAll,
				);

				return [this.helpers.returnJsonArray(responseData)];
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
				} else {
					throw error;
				}
			}
		} else if (operation === 'read') {
			for (let i = 0; i < items.length; i++) {
				try {
					const id = this.getNodeParameter('id', i) as string;
					const endpoint = (baseUrl + `data/${id}`) as string;
					const columns = (
						(this.getNodeParameter('pullAllColumns', i) as boolean)
							? undefined
							: (this.getNodeParameter('columns', i) as string[])
					)?.map((el) => (typeof el === 'string' ? el.trim() : null));
					const body = columns ? { columns: columns } : ({} as IDataObject);
					const responseData = await xataApiRequest.call(this, apiKey, 'GET', endpoint, body);
					returnData.push(responseData);
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					} else {
						throw error;
					}
				}
			}
		} else if (operation === 'update' || operation ==='upsert' || operation === 'create') {
			const sendAllColumns = this.getNodeParameter('sendAllColumns', 0) as boolean;
			const method = operation === 'update' ? 'PATCH' : operation === 'upsert' ? 'POST' : 'PUT'
			for (let i = 0; i < items.length; i++) {
				try {
					const id = this.getNodeParameter('id', i) as string;
					const endpoint = baseUrl + `data/${id}`;
					const item = getItem.call(this, i, items[i].json, sendAllColumns);

					const responseData = await xataApiRequest.call(this, apiKey, method , endpoint, item);
					returnData.push(responseData);
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					} else {
						throw error;
					}
				}
			}
		}  else {
			throw new NodeOperationError(this.getNode(), 'Operation undefined');
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
