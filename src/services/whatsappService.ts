export const whatsappService = {
  async sendConfirmation(clientName: string, whatsapp: string, service: string, date: string, time: string) {
    console.log(`[WhatsApp Simulation] Sending confirmation to ${whatsapp}...`);
    const message = `Hola ${clientName}, tu turno en DIMASI.BEAUTY quedó confirmado:
${service}
Fecha: ${date} a las ${time} hs
¡Gracias por elegirnos!`;
    
    // In a real app, we would call an API like Twilio
    // await fetch('/api/whatsapp/send', { method: 'POST', body: JSON.stringify({ to: whatsapp, body: message }) });
    
    return true;
  },

  async sendReminder(clientName: string, whatsapp: string, service: string, date: string, time: string) {
    console.log(`[WhatsApp Simulation] Sending reminder to ${whatsapp}...`);
    const message = `Recordatorio: Tu turno en DIMASI.BEAUTY es mañana ${date} a las ${time} hs.
Si necesitas cambiarlo, visita nuestro sitio. ¡Te esperamos!`;
    
    return true;
  }
};
