document.addEventListener('DOMContentLoaded', () => {
  const checkoutForm = document.getElementById('orderCheckoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
      }
      const formData = new FormData(checkoutForm);
      const customerData = Object.fromEntries(formData.entries());
      
      let message = `*New Order Details*\n\n`;
      message += `*Name:* ${customerData.name}\n`;
      message += `*Phone:* ${customerData.phone}\n`;
      if (customerData.email) message += `*Email:* ${customerData.email}\n`;
      message += `*Address:* ${customerData.address}\n`;
      if (customerData.notes) message += `*Notes:* ${customerData.notes}\n\n`;
      
      const prodName = document.getElementById('checkoutProductName').textContent;
      const prodTotal = document.getElementById('checkoutTotalPrice').textContent;
      message += `*Product:* ${prodName}\n`;
      message += `*Total Amount:* ${prodTotal}\n`;
      
      const whatsappNumber = "919876543210"; 
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      alert('Your order details have been saved! Redirecting to WhatsApp for final confirmation.');
    });
  }
});
