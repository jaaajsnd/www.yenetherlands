const express = require('express');
const { createMollieClient } = require('@mollie/api-client');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

const TICKET_TYPES = {
  vip: { name: 'VIP Arrangement', price: 299.00, color: '#00FF00' },
  platina: { name: 'Zitplaats Platina', price: 199.00, color: '#00FFFF' },
  goud: { name: 'Zitplaats Goud', price: 149.00, color: '#FFA500' },
  zilver: { name: 'Zitplaats Zilver', price: 99.00, color: '#C0C0C0' },
  brons: { name: 'Zitplaats Brons', price: 79.00, color: '#CD7F32' },
  staanplaats: { name: 'Staanplaatsen', price: 89.00, color: '#FF6600' },
  mindervaliden: { name: 'Mindervaliden', price: 89.00, color: '#90EE90' }
};

app.post('/api/create-payment', async (req, res) => {
  try {
    const { ticketType, quantity, email, name } = req.body;
    
    if (!TICKET_TYPES[ticketType]) {
      return res.status(400).json({ error: 'Invalid ticket type' });
    }

    const ticket = TICKET_TYPES[ticketType];
    const amount = (ticket.price * quantity).toFixed(2);

    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount
      },
      description: `YE GelreDome 2026 - ${ticket.name} x${quantity}`,
      redirectUrl: `${process.env.BASE_URL}/success.html`,
      webhookUrl: `${process.env.BASE_URL}/api/webhook`,
      metadata: {
        ticketType,
        quantity,
        email,
        name,
        ticketName: ticket.name
      }
    });

    res.json({ 
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const { id } = req.body;
    const payment = await mollieClient.payments.get(id);

    if (payment.status === 'paid') {
      console.log('Payment successful:', payment.metadata);
      // Hier kun je de ticket emails versturen en opslaan in database
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

app.get('/api/check-payment/:id', async (req, res) => {
  try {
    const payment = await mollieClient.payments.get(req.params.id);
    res.json({ status: payment.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**.env**
```
MOLLIE_API_KEY=test_jouwmollieapikey
BASE_URL=http://localhost:3000
PORT=3000
