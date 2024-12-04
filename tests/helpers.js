// tests/helpers.js
import mongoose from 'mongoose';

export const createTestOrdine = async (customData = {}) => {
  const Ordine = mongoose.model('Ordine');
  const defaultData = {
    nomeCliente: 'Test Cliente',
    telefono: '1234567890',
    dataRitiro: new Date(),
    oraRitiro: '10:00',
    prodotti: [{
      categoria: 'pasta',
      prodotto: 'Culurgiones',
      quantita: 2,
      unitaMisura: 'kg',
      prezzo: 15
    }]
  };

  const ordine = new Ordine({...defaultData, ...customData});
  return await ordine.save();
};