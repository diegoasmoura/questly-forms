import JSZip from 'jszip';

export const EXCEL_COLUMNS = [
  { label: 'Nome', key: 'name' },
  { label: 'CPF', key: 'cpf' },
  { label: 'Data de Nascimento', key: 'birthDate' },
  { label: 'E-mail', key: 'email' },
  { label: 'Telefone', key: 'phone' },
  { label: 'Nome Emergência', key: 'emergencyName' },
  { label: 'Telefone Emergência', key: 'emergencyPhone' },
  { label: 'RG', key: 'rg' },
  { label: 'Gênero', key: 'gender' },
  { label: 'Estado Civil', key: 'maritalStatus' },
  { label: 'Profissão', key: 'profession' }
];

const GENDER_OPTIONS  = ["Masculino", "Feminino", "Nao-Binario", "Outro"];
const MARITAL_OPTIONS = ["Solteiro", "Casado", "Uniao Estavel", "Divorciado", "Viuvo"];

// Validações
const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const PHONE_REGEX = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validatePatient = (patient, index) => {
  const errors = [];
  const rowNum = index + 2;
  
  if (!patient.name || patient.name.toString().trim() === '') {
    errors.push(`Linha ${rowNum}: Nome é obrigatório`);
  }
  
  if (!patient.cpf) {
    errors.push(`Linha ${rowNum}: CPF é obrigatório`);
  } else {
    const cpfClean = patient.cpf.toString().replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      errors.push(`Linha ${rowNum}: CPF deve ter 11 dígitos`);
    }
  }
  
  if (!patient.birthDate) {
    errors.push(`Linha ${rowNum}: Data de Nascimento é obrigatória`);
  }
  
  if (!patient.email) {
    errors.push(`Linha ${rowNum}: E-mail é obrigatório`);
  } else if (!EMAIL_REGEX.test(patient.email.toString())) {
    errors.push(`Linha ${rowNum}: E-mail inválido`);
  }
  
  if (!patient.phone) {
    errors.push(`Linha ${rowNum}: Telefone é obrigatório`);
  }
  
  if (!patient.emergencyName) {
    errors.push(`Linha ${rowNum}: Nome de Emergência é obrigatório`);
  }
  if (!patient.emergencyPhone) {
    errors.push(`Linha ${rowNum}: Telefone de Emergência é obrigatório`);
  }
  
  const genderVal = patient.gender?.toString();
  if (genderVal && !GENDER_OPTIONS.includes(genderVal)) {
    errors.push(`Linha ${rowNum}: Gênero deve ser um dos: ${GENDER_OPTIONS.join(', ')}`);
  }
  
  const maritalVal = patient.maritalStatus?.toString();
  if (maritalVal && !MARITAL_OPTIONS.includes(maritalVal)) {
    errors.push(`Linha ${rowNum}: Estado Civil deve ser um dos: ${MARITAL_OPTIONS.join(', ')}`);
  }
  
  return errors;
};

export const validateImport = (patients) => {
  const allErrors = [];
  patients.forEach((patient, index) => {
    const errors = validatePatient(patient, index);
    allErrors.push(...errors);
  });
  return allErrors;
};

const buildXlsx = async () => {
  const zip = new JSZip();

  // ── [Content_Types].xml ──
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

  // ── _rels/.rels ──
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>`);

  // ── xl/_rels/workbook.xml.rels ──
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings"
    Target="sharedStrings.xml"/>
  <Relationship Id="rId4"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    Target="styles.xml"/>
</Relationships>`);

  // ── xl/workbook.xml ──
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Pacientes" sheetId="1" r:id="rId1"/>
    <sheet name="Opcoes"    sheetId="2" r:id="rId2" state="hidden"/>
  </sheets>
</workbook>`);

  // ── xl/sharedStrings.xml ──
  const strings = [
    ...EXCEL_COLUMNS.map(c => c.label), // índices 0–10
    ...GENDER_OPTIONS,                   // índices 11–14
    ...MARITAL_OPTIONS,                  // índices 15–19
  ];
  const si = strings.map(s => `<si><t xml:space="preserve">${s}</t></si>`).join('');
  zip.file('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
     count="${strings.length}" uniqueCount="${strings.length}">
${si}
</sst>`);

  // ── xl/styles.xml ──
  zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><sz val="11"/><name val="Calibri"/><b/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF059669"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"
        applyFont="1" applyFill="1">
      <alignment horizontal="center"/>
    </xf>
  </cellXfs>
</styleSheet>`);

  // ── xl/worksheets/sheet1.xml — Pacientes ──
  const headerCells = EXCEL_COLUMNS.map((_, i) => {
    const col = String.fromCharCode(65 + i);
    return `<c r="${col}1" t="s" s="1"><v>${i}</v></c>`;
  }).join('');

  const colDefs = [20, 18, 18, 25, 15, 20, 20, 15, 15, 15, 18]
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const genderFormula  = `"${GENDER_OPTIONS.join(',')}"`;
  const maritalFormula = `"${MARITAL_OPTIONS.join(',')}"`;

  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colDefs}</cols>
  <sheetData>
    <row r="1">${headerCells}</row>
  </sheetData>
  <dataValidations count="2">
    <dataValidation type="list" allowBlank="1" showDropDown="0" sqref="I2:I1000">
      <formula1>${genderFormula}</formula1>
    </dataValidation>
    <dataValidation type="list" allowBlank="1" showDropDown="0" sqref="J2:J1000">
      <formula1>${maritalFormula}</formula1>
    </dataValidation>
  </dataValidations>
</worksheet>`);

  // ── xl/worksheets/sheet2.xml — Opcoes (hidden) ──
  const genderCells  = GENDER_OPTIONS.map((_, i) =>
    `<c r="${String.fromCharCode(65 + i)}1" t="s"><v>${11 + i}</v></c>`).join('');
  const maritalCells = MARITAL_OPTIONS.map((_, i) =>
    `<c r="${String.fromCharCode(65 + i)}2" t="s"><v>${15 + i}</v></c>`).join('');

  zip.file('xl/worksheets/sheet2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">${genderCells}</row>
    <row r="2">${maritalCells}</row>
  </sheetData>
</worksheet>`);

  return zip.generateAsync({ type: 'arraybuffer' });
};

export const generateExcelTemplate = async () => {
  try {
    const buffer = await buildXlsx();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = 'modelo_importacao_pacientes.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro: ' + error.message);
  }
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const { read, utils } = await import('xlsx');
        const wb   = read(data, { type: 'array' });
        const ws   = wb.Sheets['Pacientes'];
        const json = utils.sheet_to_json(ws);

        const patients = json.map(row => {
          let birthDate = row['Data de Nascimento'];
          if (birthDate) {
            const num = parseInt(birthDate);
            if (!isNaN(num) && num > 0) {
              const date = new Date((num - 25569) * 86400 * 1000);
              if (!isNaN(date.getTime())) {
                birthDate = date.toISOString().split('T')[0];
              }
            } else if (typeof birthDate === 'string') {
              const match = birthDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
              if (match) {
                const [, d, m, y] = match;
                const year = y.length === 2 ? (parseInt(y) > 50 ? '19' + y : '20' + y) : y;
                birthDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
            }
          }
          return {
            name:           row['Nome'],
            cpf:            row['CPF'],
            birthDate,
            email:          row['E-mail'],
            phone:          row['Telefone'],
            emergencyName:  row['Nome Emergência'],
            emergencyPhone: row['Telefone Emergência'],
            rg:             row['RG'],
            gender:         row['Gênero'],
            maritalStatus:  row['Estado Civil'],
            profession:     row['Profissão'],
          };
        });

        resolve(patients);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};