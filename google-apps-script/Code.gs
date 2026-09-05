const CLAVE_SECRETA = 'crm-terrenos-2026-cambia-esta-clave';
const NOMBRE_HOJA = 'Prospectos WhatsApp';

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
  if (!sheet) throw new Error('No existe la pestaña: ' + NOMBRE_HOJA);
  return sheet;
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function doGet() {
  try {
    const sheet = getSheet();
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length <= 1) return json({ ok: true, leads: [] });

    const headers = values[0].map(String);
    const leads = values.slice(1)
      .filter(row => row.some(value => value !== ''))
      .map((row, index) => {
        const lead = {};
        headers.forEach((header, column) => lead[header] = row[column] || '');
        lead.id = lead.identificacion || lead['Cliente / Contacto'] || `sheet-${index + 1}`;
        return lead;
      });

    return json({ ok: true, leads });
  } catch (error) {
    return json({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents || '{}');
    if (data.clave !== CLAVE_SECRETA) return json({ ok: false, error: 'Clave incorrecta' });

    const sheet = getSheet();
    const values = sheet.getDataRange().getDisplayValues();
    const headers = values[0].map(String);
    const normalizedHeaders = headers.map(normalizeHeader);
    const idColumn = normalizedHeaders.indexOf('identificacion');
    const nameColumn = normalizedHeaders.indexOf('cliente / contacto');
    const phoneColumn = normalizedHeaders.indexOf('contacto');
    const leadId = String(data.id || data.identificacion || data['Cliente / Contacto'] || '');
    const leadName = String(data['Cliente / Contacto'] || data.nombre || '');

    const rowIndex = values.findIndex((row, index) => {
      if (index === 0) return false;
      const sameId = idColumn >= 0 && String(row[idColumn]) === leadId;
      const sameName = nameColumn >= 0 && leadName && String(row[nameColumn]) === leadName;
      return sameId || sameName;
    });

    const row = headers.map((header, column) => {
      const key = normalizedHeaders[column];
      if (key === 'identificacion') return leadId;
      if (key === 'cliente / contacto') return leadName;
      if (key === 'origen / canal') return data['Origen / Canal'] || data.origen || '';
      if (key === 'fecha 1 contacto') return data['Fecha 1 CONTACTO'] || data.fecha || '';
      if (key === 'financiamiento') return data.Financiamiento || '';
      if (key === 'interes') return data['Interés'] || data.interes || '';
      if (key === 'ultimo mensaje / nota') return data['Último Mensaje / Nota'] || data.nota || '';
      if (key === 'contacto') return String(data.CONTACTO || data.contacto || '');
      if (key === 't_movin' || key === 'tmovin') return data.t_Movin || data.tmovin || '';
      if (key === 'resultado') return data.Resultado || data.etapa || 'En proceso';
      return data[header] || '';
    });

    if (phoneColumn >= 0) {
      const phoneRange = sheet.getRange(1, phoneColumn + 1, sheet.getMaxRows(), 1);
      phoneRange.setNumberFormat('@');
      phoneRange.setDataValidation(null);
    }
    if (rowIndex < 0) sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
    else sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

    return json({ ok: true, id: leadId });
  } catch (error) {
    return json({ ok: false, error: error.message });
  }
}
