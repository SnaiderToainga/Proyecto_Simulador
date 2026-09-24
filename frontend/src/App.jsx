import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [token, setToken] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [form, setForm] = useState({ monto: '', plazo: '12', tipo: '0', sistema: '0' });
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [montoError, setMontoError] = useState('');
  
  // Nuevo estado para el historial de simulaciones
  const [historial, setHistorial] = useState([]); 

  // 1. Fetch para el Microservicio de Autenticación (Puerto 5001)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      } else {
        alert("Credenciales inválidas");
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error de conexión con AuthService (5001)");
    }
  };

  // Cargar historial de la base de datos
  const cargarHistorial = async () => {
    try {
      const res = await fetch('http://localhost:5002/api/simulador/historial', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  // Disparar carga de historial al iniciar sesión exitosamente
  useEffect(() => {
    if (token) {
      cargarHistorial();
    }
  }, [token]);

  const formatearPlazo = (totalMeses) => {
    const meses = parseInt(totalMeses);

    if (meses < 12) {
      return `${meses} mes${meses > 1 ? 'es' : ''}`;
    }

    const anios = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;

    const textoAnios = `${anios} año${anios > 1 ? 's' : ''}`;
    const textoMeses = mesesRestantes > 0 ? ` y ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}` : '';

    return textoAnios + textoMeses;
  };

  const handleTipoChange = (e) => {
    const nuevoTipo = e.target.value;
    let nuevoPlazo = '12';

    if (nuevoTipo === '0') nuevoPlazo = '12';
    else if (nuevoTipo === '1') nuevoPlazo = '120';
    else if (nuevoTipo === '2') nuevoPlazo = '240';
    else if (nuevoTipo === '3') nuevoPlazo = '12';

    setForm({ ...form, tipo: nuevoTipo, plazo: nuevoPlazo });
  };

  const renderPlazoOptions = () => {
    switch (form.tipo) {
      case '0': // Preciso (Rango continuo de 3 a 48 meses)
        const opcionesPreciso = [];
        for (let i = 3; i <= 48; i++) {
          opcionesPreciso.push(<option key={i} value={i}>{formatearPlazo(i)}</option>);
        }
        return opcionesPreciso;
      case '1': // Hipotecario Vivienda
        return [36, 60, 120, 180, 240].map(m => <option key={m} value={m}>{formatearPlazo(m)}</option>);
      case '2': // Vivienda de Interés Público
        return [240, 252, 264, 276, 288, 300].map(m => <option key={m} value={m}>{formatearPlazo(m)}</option>);
      case '3': // Educación Superior
        return [6, 12, 24, 36, 48, 60].map(m => <option key={m} value={m}>{formatearPlazo(m)}</option>);
      default:
        return null;
    }
  };

  // 2. Fetch para el Microservicio del Simulador (Puerto 5002)
  const ejecutarSimulacion = async (overrideSistema = null) => {
    if (!form.monto || parseFloat(form.monto) < 1) {
      setMontoError("Ingrese un monto válido mayor o igual a $1");
      return;
    } else {
      setMontoError('');
    }
    const sistemaAEnviar = overrideSistema !== null ? parseInt(overrideSistema) : parseInt(form.sistema);
    try {
      const res = await fetch('http://localhost:5002/api/simulador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          monto: parseFloat(form.monto),
          plazoMeses: parseInt(form.plazo),
          tipo: parseInt(form.tipo),
          sistema: sistemaAEnviar
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResultados(data);
        const productos = {
          '0': 'Preciso',
          '1': 'Hipotecario Vivienda',
          '2': 'Vivienda de Interés Público',
          '3': 'Educación Superior'
        };
        setResumen({
          plazo: parseInt(form.plazo),
          producto: productos[form.tipo]
        });
        
        // Refresca la tabla del historial tras una nueva simulación exitosa
        await cargarHistorial();
        
      } else {
        alert("Error al simular crédito, token expirado o denegado.");
      }
    } catch (error) {
      console.error("Error en simulación:", error);
      alert("Error de conexión con SimuladorService (5002)");
    }
  };

  const handleSistemaChange = (nuevoSistema) => {
    setForm(prevForm => ({ ...prevForm, sistema: nuevoSistema }));
    if (form.monto && parseFloat(form.monto) >= 1) {
      ejecutarSimulacion(nuevoSistema);
    }
  };

  const handleSimularSubmit = async (e) => {
    e.preventDefault();
    ejecutarSimulacion();
  };

  // Cálculos dinámicos
  const totalInteres = resultados.reduce((acc, row) => acc + row.interes, 0);
  const totalSeguro = resultados.reduce((acc, row) => acc + (row.seguro || 0), 0);
  const capitalFinanciado = resultados.reduce((acc, row) => acc + row.capital, 0);
  const totalAPagar = capitalFinanciado + totalInteres + totalSeguro;
  const primeraCuota = resultados[0] || {};
  const tasaReferencial = form.tipo === '0' ? '15.60' : form.tipo === '1' ? '8.50' : form.tipo === '2' ? '4.99' : '9.50';

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(11, 34, 101);
    doc.text("Universidad Técnica de Ambato - Tabla de Amortización", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(51, 51, 51);
    doc.text(`Producto: ${resumen.producto}`, 14, 32);
    doc.text(`Plazo: ${formatearPlazo(resumen.plazo)}`, 14, 38);
    doc.text(`Capital: $${capitalFinanciado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, 14, 44);
    doc.text(`Tasa aplicada: ${tasaReferencial}%`, 14, 50);

    const tableColumn = ["Mes", "Capital", "Interés", "Seguro", "Cuota", "Saldo"];
    const tableRows = resultados.map(row => [
      row.mes,
      `$${row.capital.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      `$${row.interes.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      `$${(row.seguro || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      `$${row.cuota.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      `$${row.saldo.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 34, 101], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    doc.save(`Amortizacion_UTA_${resumen.producto.replace(/\s+/g, '_')}.pdf`);
  };

  if (!token) {
    return (
      <div className="uta-theme-container auth-wrapper">
        <style>{styles}</style>
        <div className="auth-card">
          <div className="uta-header-bar">
            <h2>Portal UTA</h2>
          </div>
          <div className="auth-body">
            <h3 className="auth-title">Acceso al Simulador</h3>
            <form onSubmit={handleLogin} className="form-group">
              <input
                type="text"
                placeholder="Usuario (admin)"
                className="input-field"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Contraseña (12345)"
                className="input-field"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
              <button type="submit" className="btn-uta-red btn-full">Ingresar</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uta-theme-container">
      <style>{styles}</style>

      <header className="uta-top-nav">
        <h1>Universidad Técnica de Ambato</h1>
        <span>Simulador de Créditos Institucional</span>
      </header>

      <div className="simulator-layout">
        <div className="simulator-form-panel">
          <h2 className="section-title">Parámetros del Crédito</h2>

          <form onSubmit={handleSimularSubmit} className="form-group">
            <label className="input-label">Tipo de Crédito</label>
            <select
              className="input-field"
              value={form.tipo}
              onChange={handleTipoChange}
            >
              <option value="0">Preciso (15.60%)</option>
              <option value="1">Hipotecario Vivienda (8.5%)</option>
              <option value="2">Vivienda de Interés Público (4.99%)</option>
              <option value="3">Educación Superior (9.5%)</option>
            </select>

            <label className="input-label">Monto Solicitado ($)</label>
            <input
              type="number"
              className={`input-field ${montoError ? 'input-error' : ''}`}
              step="0.01"
              placeholder="Ej: 5000"
              value={form.monto}
              onChange={e => {
                setForm({ ...form, monto: e.target.value });
                if (montoError) setMontoError('');
              }}
            />
            {montoError && <span className="error-message">{montoError}</span>}

            <label className="input-label">Plazo de Financiamiento</label>
            <select
              className="input-field"
              value={form.plazo}
              onChange={e => setForm({ ...form, plazo: e.target.value })}
            >
              {renderPlazoOptions()}
            </select>

            <label className="input-label">Sistema de Amortización</label>
            <div className="card-switch">
              <div
                className={`card-option ${form.sistema === '0' ? 'active' : ''}`}
                onClick={() => handleSistemaChange('0')}
              >
                Método Francés
                <small className="card-hint">Cuota fija mensual</small>
              </div>
              <div
                className={`card-option ${form.sistema === '1' ? 'active' : ''}`}
                onClick={() => handleSistemaChange('1')}
              >
                Método Alemán
                <small className="card-hint">Abono a capital fijo</small>
              </div>
            </div>

            <button type="submit" className="btn-uta-red btn-full" style={{ marginTop: '15px' }}>Calcular Simulación</button>
          </form>
        </div>

        {resultados.length > 0 && resumen && (
          <div className="simulator-results-panel">
            <h3 className="results-title">Resumen de Proyección</h3>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e1e4e8',
              padding: '25px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              fontFamily: 'sans-serif'
            }}>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '25px'
              }}>
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #ddd' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>Capital</div>
                  <strong style={{ fontSize: '16px', color: '#0B2265' }}>${primeraCuota.capital?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #ddd' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>Interés</div>
                  <strong style={{ fontSize: '16px', color: '#0B2265' }}>${primeraCuota.interes?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase' }}>Seguro</div>
                  <strong style={{ fontSize: '16px', color: '#0B2265' }}>${(primeraCuota.seguro || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <p style={{ fontSize: '15px', color: '#555', margin: '0 0 10px 0' }}>Cuota referencial mensual</p>
                <h1 style={{ fontSize: '48px', color: '#8B0000', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  ${primeraCuota.cuota?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </h1>
                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                  Durante {formatearPlazo(resumen.plazo)} a una tasa del {tasaReferencial}%
                </p>
                {form.sistema === '1' && (
                  <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>* Cuota decreciente en el tiempo (Sistema Alemán)</p>
                )}
                {form.sistema === '0' && (
                  <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>* Cuota varía ligeramente por recálculo de seguro sobre saldos</p>
                )}
              </div>

              <div style={{
                borderTop: '1px solid #eee',
                paddingTop: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: '#555' }}>Capital Financiado:</span>
                  <strong style={{ color: '#333' }}>${capitalFinanciado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: '#555' }}>Total de interés:</span>
                  <strong style={{ color: '#333' }}>${totalInteres.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: '#555' }}>Total seguro desgravamen:</span>
                  <strong style={{ color: '#333' }}>${totalSeguro.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px dashed #ccc',
                  fontSize: '16px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Total a pagar:</span>
                  <strong style={{ color: '#8B0000', fontSize: '18px' }}>${totalAPagar.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '25px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0B2265',
                    textDecoration: 'underline',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Ver tabla de amortización detallada
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Simulaciones Registradas */}
        {historial.length > 0 && (
          <div style={{ width: '100%', marginTop: '40px' }}>
            <h3 style={{ color: '#0B2265', borderBottom: '3px solid #8B0000', paddingBottom: '10px', marginBottom: '20px', fontSize: '22px' }}>
              Historial de Simulaciones Registradas
            </h3>
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'sans-serif' }}>
                <thead style={{ backgroundColor: '#0B2265', color: '#fff' }}>
                  <tr>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Fecha</th>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Crédito</th>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Monto</th>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Plazo</th>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Sistema</th>
                    <th style={{ padding: '14px 16px', fontWeight: '500' }}>Cuota Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((sim, idx) => (
                    <tr key={sim.id || idx} style={{ borderBottom: '1px solid #eaeaea', backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                      <td style={{ padding: '14px 16px', color: '#555' }}>
                        {new Date(sim.fecha).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#333' }}>{sim.tipoCredito}</td>
                      <td style={{ padding: '14px 16px', color: '#333' }}>
                        ${sim.monto.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#333' }}>{formatearPlazo(sim.plazoMeses)}</td>
                      <td style={{ padding: '14px 16px', color: '#333' }}>{sim.sistemaAmortizacion}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#8B0000' }}>
                        ${sim.cuotaReferencial.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Tabla Completa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>

            <div className="modal-header">
              <h3>Tabla de Amortización</h3>
              <div className="modal-info-pills">
                <span className="pill"><strong>Tipo:</strong> {resumen.producto}</span>
                <span className="pill"><strong>Plazo:</strong> {formatearPlazo(resumen.plazo)}</span>
                <span className="pill"><strong>Monto:</strong> ${capitalFinanciado.toLocaleString('es-EC')}</span>
                <span className="pill"><strong>Tasa:</strong> {tasaReferencial}%</span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="uta-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Capital</th>
                    <th>Interés</th>
                    <th>Seguro</th>
                    <th>Cuota Mensual</th>
                    <th>Saldo Capital</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map(row => (
                    <tr key={row.mes}>
                      <td>{row.mes}</td>
                      <td>${row.capital.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                      <td>${row.interes.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                      <td>${(row.seguro || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                      <td className="highlight-cell">${row.cuota.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                      <td>${row.saldo.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn-uta-blue" onClick={exportToPDF}>
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
  .uta-theme-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    background-color: #f0f2f5;
    min-height: 100vh;
    box-sizing: border-box;
    padding-bottom: 40px;
  }
  
  .uta-top-nav {
    background-color: #0B2265; /* Azul Marino UTA */
    color: white;
    padding: 15px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .uta-top-nav h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }
  
  .uta-top-nav span {
    font-size: 16px;
    opacity: 0.9;
  }

  .auth-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .auth-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    width: 100%;
    max-width: 420px;
    overflow: hidden;
  }

  .uta-header-bar {
    background-color: #0B2265;
    color: white;
    padding: 20px;
    text-align: center;
  }

  .uta-header-bar h2 {
    margin: 0;
    font-size: 24px;
  }

  .auth-body {
    padding: 35px 30px;
  }
  
  .auth-title {
    color: #333;
    text-align: center;
    margin-top: 0;
    margin-bottom: 25px;
  }

  .simulator-layout {
    max-width: 1050px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    align-items: flex-start;
    padding: 0 20px;
  }

  .simulator-form-panel, .simulator-results-panel {
    background: #fff;
    padding: 35px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    flex: 1 1 450px;
    border-top: 4px solid #8B0000; /* Borde superior Rojo UTA */
  }

  .section-title, .results-title {
    color: #0B2265;
    margin-top: 0;
    margin-bottom: 25px;
    font-size: 22px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .input-label {
    font-weight: 600;
    font-size: 14px;
    color: #444;
    margin-bottom: -10px;
  }

  .input-field {
    padding: 12px 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input-field:focus {
    border-color: #0B2265;
    box-shadow: 0 0 0 3px rgba(11, 34, 101, 0.1);
  }

  .input-error {
    border-color: #8B0000;
  }
  
  .input-error:focus {
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
  }

  .error-message {
    color: #8B0000;
    font-size: 13px;
    font-weight: 500;
    margin-top: -12px;
  }

  .card-switch {
    display: flex;
    gap: 15px;
    margin-top: 5px;
  }

  .card-option {
    flex: 1;
    padding: 18px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    font-weight: 600;
    color: #666;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    user-select: none;
  }

  .card-option.active {
    border-color: #8B0000; /* Rojo UTA */
    background-color: #fffaf9;
    color: #8B0000;
  }

  .card-hint {
    font-size: 12px;
    font-weight: normal;
    opacity: 0.8;
  }

  .btn-uta-red {
    background-color: #8B0000; /* Rojo Granate UTA */
    color: #ffffff;
    border: none;
    padding: 14px 24px;
    font-weight: 600;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s, transform 0.1s;
  }

  .btn-uta-red:hover {
    background-color: #6e0000;
  }
  
  .btn-uta-red:active {
    transform: scale(0.98);
  }

  .btn-uta-blue {
    background-color: #0B2265; /* Azul Marino UTA */
    color: #ffffff;
    border: none;
    padding: 12px 24px;
    font-weight: 600;
    border-radius: 5px;
    cursor: pointer;
    font-size: 15px;
    transition: background-color 0.2s;
  }

  .btn-uta-blue:hover {
    background-color: #08194a;
  }

  .btn-full {
    width: 100%;
  }

  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: #fff;
    border-radius: 8px;
    width: 100%;
    max-width: 850px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    background: transparent;
    border: none;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    color: #888;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #8B0000;
  }

  .modal-header {
    padding: 25px 30px 20px;
    border-bottom: 1px solid #eaeaea;
  }
  
  .modal-header h3 {
    margin: 0 0 15px 0;
    color: #0B2265;
    font-size: 22px;
  }

  .modal-info-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .pill {
    background: #f0f2f5;
    color: #0B2265;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid #e1e4e8;
  }

  .table-responsive {
    padding: 0 30px;
    overflow-y: auto;
    flex: 1;
    max-height: 55vh;
  }

  .uta-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .uta-table th {
    background: #0B2265;
    color: #ffffff;
    padding: 14px 12px;
    text-align: left;
    position: sticky;
    top: 0;
    z-index: 1;
    font-weight: 500;
  }

  .uta-table td {
    padding: 12px;
    border-bottom: 1px solid #eaeaea;
    color: #444;
  }

  .uta-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .highlight-cell {
    font-weight: 600;
    color: #8B0000;
  }

  .modal-footer {
    padding: 20px 30px;
    border-top: 1px solid #eaeaea;
    display: flex;
    justify-content: flex-end;
    background-color: #fafbfc;
    border-radius: 0 0 8px 8px;
  }
`;