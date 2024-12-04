import { subDays, format } from 'date-fns';
import { it } from 'date-fns/locale';

export const generateTimeSeriesData = async (metriche, periodo = 7) => {
  const dates = Array.from({ length: periodo }).map((_, i) => 
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  ).reverse();

  return {
    labels: dates,
    datasets: {
      ordini: {
        label: 'Ordini',
        data: metriche.ordini.map(m => ({
          x: m.data,
          y: m.totale
        }))
      },
      completamento: {
        label: 'Tasso Completamento',
        data: metriche.completamento.map(m => ({
          x: m.data,
          y: m.percentuale
        }))
      },
      prestazioni: {
        label: 'Prestazioni Sistema',
        data: metriche.sistema.map(m => ({
          x: m.timestamp,
          cpu: m.cpu.percentualeUso,
          memoria: m.memoria.percentualeUso,
          tempoRisposta: m.tempiRisposta.db
        }))
      }
    }
  };
};

export const generateDashboardCharts = async (datiDashboard) => {
  return {
    ordiniPerOra: {
      type: 'bar',
      data: {
        labels: datiDashboard.ordiniPerOra.map(o => o._id),
        datasets: [{
          label: 'Numero Ordini',
          data: datiDashboard.ordiniPerOra.map(o => o.numeroOrdini)
        }]
      }
    },
    prodottiPerCategoria: {
      type: 'pie',
      data: {
        labels: datiDashboard.ordiniPerCategoria.map(c => c._id),
        datasets: [{
          data: datiDashboard.ordiniPerCategoria.map(c => c.valoreTotale)
        }]
      }
    },
    trendCompletamento: {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Tasso Completamento',
          data: datiDashboard.trend.map(t => t.tassoCompletamento)
        }]
      }
    }
  };
};