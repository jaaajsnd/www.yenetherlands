const TICKET_TYPES = {
  vip: { name: 'VIP Arrangement', price: 299.00 },
  platina: { name: 'Zitplaats Platina', price: 199.00 },
  goud: { name: 'Zitplaats Goud', price: 149.00 },
  zilver: { name: 'Zitplaats Zilver', price: 99.00 },
  brons: { name: 'Zitplaats Brons', price: 79.00 },
  staanplaats: { name: 'Staanplaatsen', price: 89.00 },
  mindervaliden: { name: 'Mindervaliden', price: 89.00 }
};

let selectedTicketType = null;

const modal = document.getElementById('orderModal');
const closeBtn = document.getElementsByClassName('close')[0];
const orderForm = document.getElementById('orderForm');
const quantitySelect = document.getElementById('quantity');

// Interactive seating plan
document.addEventListener('DOMContentLoaded', function() {
    const seatZones = document.querySelectorAll('.seat-zone');
    
    seatZones.forEach(zone => {
        zone.addEventListener('click', function() {
            const ticketType = this.dataset.type;
            selectTicket(ticketType);
            
            // Scroll naar tickets sectie
            document.querySelector('.tickets-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Highlight selected ticket card
            highlightTicketCard(ticketType);
        });
    });
});

function highlightTicketCard(ticketType) {
    // Remove previous highlights
    document.querySelectorAll('.ticket-card').forEach(card => {
        card.style.border = '2px solid #2d2d2d';
    });
    
    // Highlight selected card
    const selectedCard = document.querySelector(`.ticket-card[data-type="${ticketType}"]`);
    if (selectedCard) {
        selectedCard.style.border = '2px solid #FFA500';
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function selectTicket(ticketType) {
    selectedTicketType = ticketType;
    const ticket = TICKET_TYPES[ticketType];
    
    document.getElementById('ticketTypeName').value = ticket.name;
    updateTotal();
    modal.style.display = 'block';
}

function updateTotal() {
    const quantity = parseInt(quantitySelect.value);
    const ticket = TICKET_TYPES[selectedTicketType];
    const total = (ticket.price * quantity).toFixed(2);
    document.getElementById('totalPrice').textContent = total;
}

quantitySelect.addEventListener('change', updateTotal);

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quantity = parseInt(document.getElementById('quantity').value);
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    
    // Show loading state
    const submitButton = orderForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticketType: selectedTicketType,
                quantity,
                name,
                email
            })
        });
        
        const data = await response.json();
        
        if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            alert('Er is een fout opgetreden. Probeer het opnieuw.');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Er is een fout opgetreden. Probeer het opnieuw.');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});
