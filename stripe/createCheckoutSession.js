import Stripe from 'stripe';

import { failure, resourceNotFound, success } from '../libs/response-lib';
import * as dynamoDbLib from '../libs/dynamodb-lib';

export const main = async event => {
  /**
   * @type {number} amount
   * @type {string} companyId - uuid
   */
  const { amount, companyId } = JSON.parse(event.body);

  const params = {
    TableName: process.env.COMPANIES_TABLE_NAME,
    Key: {
      companyId
    },
    ProjectionExpression: 'stripeUserId'
  };

  console.log(`Get the company with ID: ${companyId}`);
  let stripeUserId;
  try {
    const result = await dynamoDbLib.call('get', params);

    if (result.Item) {
      stripeUserId = result.Item.stripeUserId;
    } else {
      return resourceNotFound({ status: false, error: 'Item not found!' });
    }
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  console.log('Initialize Stripe');
  const stripe = Stripe(process.env.STRIPE_API_SECRET_KEY);

  console.log('Create a payment checkout session with Stripe');
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card', 'ideal'],
        line_items: [
          {
            name: 'Coupon',
            amount,
            currency: 'eur',
            quantity: 1
          }
        ],
        success_url: `${process.env.STRIPE_CHECKOUT_REDIRECT_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.STRIPE_CHECKOUT_REDIRECT_CANCEL
      },
      {
        stripeAccount: stripeUserId
      }
    );

    console.log('Stripe checkout session successfully created')
  } catch (e) {
    console.error(e);
    return failure({ status: false });
  }

  return success(session);
};