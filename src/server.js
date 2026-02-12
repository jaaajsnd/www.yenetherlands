const express = require('express');
const { createMollieClient } = require('@mollie/api-client');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mollie Client
const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY 
});

// Ticket Types Configuration
const TICKET_TYPES = {
  vip: { 
    name: 'VIP Arrangement', 
    price: 299.00, 
    color: '#00FF00',
    description: 'Premium seating with exclusive VIP area access and complimentary drinks'
  },
  platina: { 
    name: 'Zitplaats Platina', 
    price: 199.00, 
    color: '#00FFFF',
    description: 'Best view guaranteed with premium seating sections'
  },
  goud: { 
    name: 'Zitplaats Goud', 
    price: 149.00, 
    color: '#FFA500',
    description: 'Excellent seating with great stage visibility'
  },
  zilver: { 
    name: 'Zitplaats Zilver', 
    price: 99.00, 
    color: '#C0C0C0',
    description: 'Good seating with clear stage view'
  },
  brons: { 
    name: 'Zitplaats Brons', 
    price: 79.00, 
    color: '#CD7F32',
    description: 'Standard seating for full concert experience'
  },
  staanplaats: { 
    name: 'Staanplaatsen', 
    price: 89.00, 
    color: '#FF6600',
    description: 'Standing area close to the stage for ultimate concert vibe'
  },
  mindervaliden: { 
    name: 'Mindervaliden', 
    price: 89.00, 
    color: '#90EE90',
    description: 'Accessible seating with wheelchair friendly access and companion seat'
  }
};

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available ticket types
app.get('/api/tickets', (req, res) => {
  res.json(TICKET_TYPES);
});

// Create payment
app.post('/api/create-payment', async (req, res) => {
  try {
    const { ticketType, quantity, email, name } = req.body;
    
    // Validation
    if (!ticketType || !quantity || !email || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['ticketType', 'quantity', 'email', 'name']
      });
    }

    if (!TICKET_TYPES[ticketType]) {
      return res.status(400).json({ 
        error: 'Invalid ticket type',
        validTypes: Object.keys(TICKET_TYPES)
      });
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      return res.status(400).json({ 
        error: 'Quantity must be between 1 and 10'
      });
    }

    const ticket = TICKET_TYPES[ticketType];
    const amount = (ticket.price * parsedQuantity).toFixed(2);

    console.log('Creating payment:', {
      ticketType,
      quantity: parsedQuantity,
      amount,
      email,
      name
    });

    // Create Mollie payment
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount
      },
      description: `YE GelreDome 2026 - ${ticket.name} x${parsedQuantity}`,
      redirectUrl: `${process.env.BASE_URL}/success.html`,
      webhookUrl: `${process.env.BASE_URL}/api/webhook`,
      metadata: {
        ticketType,
        quantity: parsedQuantity,
        email,
        name,
        ticketName: ticket.name,
        eventDate: '2026-06-06',
        venue: 'GelreDome Arnhem'
      }
    });

    console.log('Payment created:', payment.id);

    res.json({ 
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: amount
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment',
      message: error.message 
    });
  }
});

// Webhook endpoint for Mollie
app.post('/api/webhook', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      console.error('Webhook called without payment ID');
      return res.sendStatus(400);
    }

    console.log('Webhook received for payment:', id);

    const payment = await mollieClient.payments.get(id);

    console.log('Payment status:', payment.status);
    console.log('Payment metadata:', payment.metadata);

    if (payment.status === 'paid') {
      console.log('✓ Payment successful!');
      console.log('Customer:', payment.metadata.name);
      console.log('Email:', payment.metadata.email);
      console.log('Tickets:', payment.metadata.quantity, 'x', payment.metadata.ticketName);
      
      // TODO: Hier kun je:
      // - Tickets genereren en per email versturen
      // - Opslaan in database
      // - Confirmatie email sturen
      // - Ticket PDF genereren
    } else if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      console.log('✗ Payment not successful:', payment.status);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Check payment status
app.get('/api/check-payment/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const payment = await mollieClient.payments.get(id);

    res.json({ 
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    });

  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({ 
      error: 'Failed to check payment status',
      message: error.message
    });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`YE Tickets Server Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
  console.log(`Mollie API: ${process.env.MOLLIE_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
  console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
