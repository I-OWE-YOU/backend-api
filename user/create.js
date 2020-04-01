import * as dynamoDbLib from '../libs/dynamodb-lib';

export const main = async event => {
  /**
   * @property {string} userId
   * @property {string} email
   */
	const { sub, email } = event.request.userAttributes;

	const params = {
		TableName: process.env.USERS_TABLE_NAME,
		Item: {
			userId: sub,
			email: email
		}
	};

	try {
		await dynamoDbLib.call('put', params);
		return event;
	} catch (e) {
		return event;
	}
};