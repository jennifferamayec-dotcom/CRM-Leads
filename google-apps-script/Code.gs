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
    const idColumn = headers.indexOf('identificacion');
    const nameColumn = headers.indexOf('Cliente / Contacto');
    const leadId = String(data.id || data.identificacion || data['Cliente / Contacto'] || '');
    const leadName = String(data['Cliente / Contacto'] || data.nombre || '');

    const rowIndex = values.findIndex((row, index) => {
      if (index === 0) return false;
      const sameId = idColumn >= 0 && String(row[idColumn]) === leadId;
      const sameName = nameColumn >= 0 && leadName && String(row[nameColumn]) === leadName;
      return sameId || sameName;
    });

    const row = headers.map(header => {
      if (header === 'identificacion') return leadId;
      if (header === 'Cliente / Contacto') return leadName;
      if (header === 'Origen / Canal') return data['Origen / Canal'] || data.origen || '';
      if (header === 'Fecha 1 CONTACTO') return data['Fecha 1 CONTACTO'] || data.fecha || '';
      if (header === 'Interés') return data['Interés'] || data.interes || '';
      if (header === 'Último Mensaje / Nota') return data['Último Mensaje / Nota'] || data.nota || '';
      if (header === 'CONTACTO') return data.CONTACTO || data.contacto || '';
      if (header === 'Resultado') return data.Resultado || data.etapa || 'En proceso';
      return data[header] || '';
    });

    if (rowIndex < 0) sheet.appendRow(row);
    else sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

    return json({ ok: true, id: leadId });
  } catch (error) {
    return json({ ok: false, error: error.message });
  }
}
