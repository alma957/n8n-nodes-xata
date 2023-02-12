import {
	IExecuteFunctions
} from 'n8n-core';

import {
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	NodeApiError,
} from 'n8n-workflow';


export function getAdditionalOptions(additionalOptions: IDataObject) {

	const body = {} as IDataObject;

	for (const key in additionalOptions) {

		if (key === 'ignoreColumns' && additionalOptions[key] !== '') {

			body[key] = (additionalOptions[key] as string[]).map(el => typeof el === 'string' ? el.trim() : null);

		} else if ((key === 'filter' || key === 'sort') && additionalOptions[key] !== '') {

			try {

				body[key] = JSON.parse(additionalOptions[key] as string) as IDataObject;

			} catch (error) {

				throw new Error(`Cannot parse ${key} to JSON. Check the ${key} (JSON) option`);

			}

		} else if (key === 'offset' || key === 'size') {

			if(body['page']) {

				(body['page'] as IDataObject)![key] = additionalOptions[key]

			} else {

				body['page'] = {[key]:additionalOptions[key]}

			}

		} else if (additionalOptions[key]) {

			body[key] = additionalOptions[key];

		}
	}

	return body;
}

export function getItem(this: IExecuteFunctions, index: number, item: IDataObject, sendAllColumns: boolean) {

	if (!sendAllColumns) {

		const columns = (this.getNodeParameter('columns', index, []) as string[])?.map(el => typeof el === 'string' ? el.trim() : null) as string[];
		const ignore = false;
		const returnData = filterItemColumns(item, columns, ignore);
		return returnData;

	} else {

		const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as IDataObject;

		if (additionalOptions['ignoreColumns'] && additionalOptions['ignoreColumns'] !== '') {

			const columns = additionalOptions['ignoreColumns'] as string[];
			const ignore = true;
			const returnData = filterItemColumns(item, columns, ignore);
			return returnData;

		} else {

			return item;

		}

	}

}

export function filterItemColumns(item: IDataObject, filterColumns: string[], ignore: boolean) {

	const returnData = ignore ? item : {} as IDataObject; // if ignore column option is used, take the data and eliminate columns
	filterColumns.forEach((el: string) => ignore ? delete returnData[el] : returnData[el] = item[el]);
	return returnData;

}

export async function xataApiRequest(this: IExecuteFunctions, apiKey: string, method: IHttpRequestMethods, endpoint: string, body: IDataObject, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any

	const options: IHttpRequestOptions = {

		url: endpoint,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		method,
		body,
		json: true,

	};

	if (Object.keys(option).length !== 0) {

		Object.assign(options, option);

	}

	try {

		const responseData = await this.helpers.httpRequest(options);
		return responseData;

	} catch (error) {

		throw new NodeApiError(this.getNode(), error);
	}

}

export async function xataApiList(this: IExecuteFunctions, apiKey: string, method: IHttpRequestMethods, endpoint: string, body: IDataObject, returnAll: boolean): Promise<any> { // tslint:disable-line:no-any

	const page = body['page'] as IDataObject;

	let records = new Array();

	if (returnAll) {

		try {

			const size = page ? page['size'] ? page['size'] : 200 : 200;
			let arrayLength = 0;

			do {

				const responseData = await xataApiRequest.call(this, apiKey, method, endpoint, body);
				const crs = responseData.meta.page.cursor;
				const recs = responseData.records;
				recs.forEach((el: IDataObject)=>records.push(el))

				Object.assign(body, { 'page': { 'after': crs, 'size' : size } });

				if (body!.hasOwnProperty('filter')) {

					delete body['filter']; // if set, filter already encoded in cursor.

				}
				if (body!.hasOwnProperty('sort')) {

					delete body['sort']; // if set, sort already encoded in cursor.

				}

				arrayLength = recs.length;

			} while (arrayLength !== 0);

		} catch (error) {

			throw new NodeApiError(this.getNode(), error);

		}


	} else {

		const offset = page ? page['offset'] ? page['offset']  : 0 : 0;
		const size = this.getNodeParameter('size', 0) as number;
		Object.assign(body, { 'page': { 'size': size, 'offset':offset } });

		try {

			const responseData = await xataApiRequest.call(this, apiKey, method,endpoint, body);
			records = responseData.records;

		} catch (error) {

			throw new NodeApiError(this.getNode(), error);

		}

	}

	return records;

}
