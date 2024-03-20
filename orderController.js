const knex = require('knex')(require('./knexfile'));

const axios = require('axios');
const crypto = require('crypto');

async function create_order(req, res) {
    const data = req.body;
    try {
        const invoiceId = await createInvoice(data);

        return res.status(200).json({
            invoice_id: invoiceId,
            status: 'pending',
            price: parseFloat(data.price)
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

function createPortPosAuthorizationToken() {
    const timestamp = Math.floor(Date.now() / 1000); 
    const secretKey = process.env.PORTPOS_SECRETKEY;
    const hash = crypto.createHash('md5').update(secretKey + timestamp).digest('hex');
    const token = `${process.env.PORTPOS_APPKEY}:${hash}`;
    const encodedToken = Buffer.from(token).toString('base64');
    return `Bearer ${encodedToken}`;
}

function preparePayload(data) {
    return {
        order: {
            amount: parseFloat(data.price),
            currency: 'BDT',
            redirect_url: process.env.PAYMENT_REDIRECT_URL,
            ipn_url: process.env.IPN_URL
        },
        product: {
            name: data.product_name,
            description: data.product_details
        },
        billing: {
            customer: {
                name: data.customer_name,
                email: data.customer_email,
                phone: data.customer_phone,
                address: {
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    zipcode: data.zipcode,
                    country: data.country
                }
            }
        }
    };
}

async function createInvoice(values) {
    const authorization = createPortPosAuthorizationToken();
    console.log(authorization);
    const payload = preparePayload(values);

    try {
        const response = await axios.post(process.env.PORTPOS_INVOICE, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            }
        });

        const data = response.data;
        const invoiceId = data.data.invoice_id || null;
        const paymentUrl = data.data.action.url || null;

        if (!invoiceId) {
            throw new Error('Payment Url not available right now.');
        }

        const orderId = await createOrder(values, invoiceId);
        return { order_id: orderId,
            invoice_id: invoiceId,
            payment_url: paymentUrl,
            status: 'pending',
            price: parseFloat(values.price) };
    } catch (error) {
        console.error('Error creating invoice:', error.message);
        throw new Error('Internal server error');
    }
}

async function createOrder(data, invoiceId) {
    try {
        const order = {
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            customer_address: `${data.street} | ${data.city} | ${data.state} | ${data.zipcode} | ${data.country}`,
            price: data.price,
            product_name: data.product_name,
            product_details: data.product_details,
            invoice_id: invoiceId,
            status: 'pending'
        };
        const [orderId] = await knex('orders').insert(order);
        return orderId;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error; 
    }
}

async function ipn(req, res) {
    try {
        const { invoice, amount, status } = req.body;

        if (status !== 'ACCEPTED') {
            return res.status(400).json({ status: status, message: 'Payment not accepted' });
        }

        const authorization = createPortPosAuthorizationToken();
        const ipnPaymentStatusUrl = `${process.env.IPN_PAYMENT_STATUS}/${invoice}/${amount}`;

        const response = await axios.get(ipnPaymentStatusUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            }
        });

        const paymentStatus = response.data.data.order.status || null;

        if (paymentStatus !== 'ACCEPTED') {
            return res.status(200).json({ error: 'Not an accepted payment' });
        }

        changeStatus(invoice);

        return res.status(200).json({ message: 'Accepted payment' });
    } catch (error) {
        console.error('Error processing IPN:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function changeStatus(invoiceId) {
    try {
        const order = await knex('orders').where('invoice_id', invoiceId).first();

        if (order) {
            await knex('orders').where('invoice_id', invoiceId).update({ status: 'paid' });
            return true; 
        } else {
            return false; 
        }
    } catch (error) {
        console.error('Error changing order status:', error);
        throw error;
    }
}

async function order_list(req, res) {
    try {
        const orders = await knex('orders').whereNull('deleted_at');
        res.json(orders);
    } catch (error) {
        console.error('Error fetching order list:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    create_order, order_list, ipn
};