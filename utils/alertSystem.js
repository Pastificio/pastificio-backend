import logger from '../config/logger.js';

// Soglie per gli alert
const ALERT_THRESHOLDS = {
  sistema: {
    cpu: 85,          // Percentuale uso CPU
    memoria: 90,      // Percentuale uso memoria
    tempoRisposta: 300 // Millisecondi
  },
  business: {
    completamento: 80,  // Percentuale ordini completati
    ritardo: 10,       // Numero massimo ordini in ritardo
    carico: 90         // Percentuale capacità giornaliera
  }
};

class AlertSystem {
  constructor() {
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  async checkSystemAlerts(metriche) {
    const alerts = [];

    // CPU
    if (metriche.cpu.percentualeUso > ALERT_THRESHOLDS.sistema.cpu) {
      alerts.push({
        tipo: 'sistema',
        livello: 'warning',
        messaggio: `Uso CPU elevato: ${metriche.cpu.percentualeUso}%`,
        dettagli: metriche.cpu
      });
    }

    // Memoria
    if (metriche.memoria.percentualeUso > ALERT_THRESHOLDS.sistema.memoria) {
      alerts.push({
        tipo: 'sistema',
        livello: 'warning',
        messaggio: `Uso memoria elevato: ${metriche.memoria.percentualeUso}%`,
        dettagli: metriche.memoria
      });
    }

    // Tempi di risposta
    if (metriche.tempiRisposta.db > ALERT_THRESHOLDS.sistema.tempoRisposta) {
      alerts.push({
        tipo: 'sistema',
        livello: 'warning',
        messaggio: `Tempi di risposta database degradati: ${metriche.tempiRisposta.db}ms`,
        dettagli: metriche.tempiRisposta
      });
    }

    return this.processAlerts(alerts);
  }

  async checkBusinessAlerts(metriche) {
    const alerts = [];

    // Percentuale completamento
    if (metriche.completamento < ALERT_THRESHOLDS.business.completamento) {
      alerts.push({
        tipo: 'business',
        livello: 'warning',
        messaggio: `Bassa percentuale di completamento: ${metriche.completamento}%`,
        dettagli: { target: ALERT_THRESHOLDS.business.completamento }
      });
    }

    // Ordini in ritardo
    if (metriche.ordiniInRitardo > ALERT_THRESHOLDS.business.ritardo) {
      alerts.push({
        tipo: 'business',
        livello: 'critical',
        messaggio: `Troppi ordini in ritardo: ${metriche.ordiniInRitardo}`,
        dettagli: { limite: ALERT_THRESHOLDS.business.ritardo }
      });
    }

    // Carico di lavoro
    if (metriche.percentualeCarico > ALERT_THRESHOLDS.business.carico) {
      alerts.push({
        tipo: 'business',
        livello: 'warning',
        messaggio: `Carico di lavoro elevato: ${metriche.percentualeCarico}%`,
        dettagli: { limite: ALERT_THRESHOLDS.business.carico }
      });
    }

    return this.processAlerts(alerts);
  }

  private processAlerts(newAlerts) {
    const timestamp = new Date();
    
    newAlerts.forEach(alert => {
      const key = `${alert.tipo}-${alert.messaggio}`;
      alert.timestamp = timestamp;

      // Controlla se l'alert è già attivo
      if (!this.activeAlerts.has(key)) {
        this.activeAlerts.set(key, alert);
        this.alertHistory.push(alert);
        logger.warn(`Nuovo alert: ${alert.messaggio}`);
      }
    });

    // Rimuovi alert risolti
    this.activeAlerts.forEach((alert, key) => {
      if (!newAlerts.some(a => `${a.tipo}-${a.messaggio}` === key)) {
        this.activeAlerts.delete(key);
        this.alertHistory.push({
          ...alert,
          risolto: timestamp,
          durata: timestamp - alert.timestamp
        });
      }
    });

    return Array.from(this.activeAlerts.values());
  }

  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory() {
    return this.alertHistory;
  }
}

export default new AlertSystem();