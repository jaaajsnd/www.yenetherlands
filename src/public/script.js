let selectedTicketType = null;
let selectedTicketPrice = 0;

const TICKET_TYPES = {
    staanplaats: { name: 'Staanplaatsen' },
    zilver: { name: 'Zitplaats Zilver' },
    brons: { name: 'Zitplaats Brons' },
    mindervaliden: { name: 'Mindervaliden' }
};

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = section.previousElementSibling;
    
    if (section.classList.contains('open')) {
        section.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        section.classList.add('open');
        toggle.classList.add('active');
    }
}

function selectTicket(ticketType, ticketName, price) {
    selectedTicketType = ticketType;
    selectedTicketPrice = price;
    
    document.getElementById('ticketTypeName').value = ticketName;
    document.getElementById('quantity').value = 1;
    updateTotal();
    
    document.getElementById('orderModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const serviceCharge = 3.95;
    const total = (selectedTicketPrice * quantity) + (serviceCharge * quantity);
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

// Open eerste sectie by default
document.addEventListener('DOMContentLoaded', function() {
    toggleSection('standing');
    
    const quantitySelect = document.getElementById('quantity');
    if (quantitySelect) {
        quantitySelect.addEventListener('change', updateTotal);
    }
    
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const quantity = parseInt(document.getElementById('quantity').value);
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            
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
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeModal();
    }
}
