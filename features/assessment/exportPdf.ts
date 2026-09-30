import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { AssessmentLocale, CATALOG_VERSION, SCORING_VERSION, REFLECTION_QUESTIONS, ReflectionAnswer, calculateReflectionReport } from './model';
import { getCopy, scaleOptions } from './copy';
import { SUBSCALE_LABELS } from './subscaleLabels';
import { encodeTransfer } from './transfer';

// Les polices PDF standard ne couvrent pas toutes les ponctuations Unicode.
const pdfText = (value: string): string => value.replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\u202f/g, ' ');
export async function createAssessmentPdf(answers: ReflectionAnswer[], locale: AssessmentLocale, includeContext = false): Promise<jsPDF> {
  const t = getCopy(locale);
  const report = calculateReflectionReport(answers);
  const doc = new jsPDF();
  const width = 174;
  doc.setFontSize(22); doc.text('NDee', 18, 22);
  doc.setFontSize(15); doc.text(pdfText(t.results), 18, 32);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(pdfText(`${t.resultsIntro} ${report.answered}/${report.total} ${t.answered} - ${report.complete ? t.complete : t.partial}.`), width), 18, 42);
  autoTable(doc, {
    startY: 62, head: [[t.results, '%', t.answered, '']],
    body: report.domains.map(domain => [pdfText(t.domains[domain.domain]), domain.score === null ? '-' : String(domain.score), `${domain.answered}/${domain.total}`, pdfText(domain.score === null ? t.empty : domain.complete ? t.complete : t.partial)]),
    margin: { left: 18, right: 18 }, theme: 'striped', styles: { fontSize: 10 }, headStyles: { fillColor: [49, 91, 78] }
  });
  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  const methodLines = doc.splitTextToSize(pdfText(t.methodsDetail), width);
  doc.text(methodLines, 18, y); y += methodLines.length * 4 + 8;
  doc.text(doc.splitTextToSize(pdfText(`${t.version} : ${CATALOG_VERSION} / ${SCORING_VERSION}`), width), 18, y);

  doc.addPage();
  doc.setFontSize(15); doc.text(pdfText(t.details), 18, 22);
  autoTable(doc, {
    startY: 30, head: [[t.results, t.details, '%', t.answered]],
    body: report.domains.flatMap(domain => domain.subscales.map(subscale => [pdfText(t.domains[domain.domain]), pdfText(SUBSCALE_LABELS[locale][subscale.id]), subscale.score === null ? '-' : String(subscale.score), `${subscale.answered}/${subscale.total}`])),
    margin: { left: 18, right: 18 }, theme: 'striped', styles: { fontSize: 9 }, headStyles: { fillColor: [49, 91, 78] }
  });
  doc.addPage();
  doc.setFontSize(15); doc.text(pdfText(t.review), 18, 22);
  const byId = new Map(answers.map(answer => [answer.questionId, answer.score]));
  autoTable(doc, {
    startY: 30, head: [[t.review, t.answered]],
    body: REFLECTION_QUESTIONS.filter(question => includeContext || question.domain !== 'context').map(question => {
      const score = byId.get(question.id);
      return [pdfText(question.text[locale]), pdfText(score === undefined ? t.empty : scaleOptions(question.scale, locale).find(option => option.value === score)!.label)];
    }),
    margin: { left: 18, right: 18 }, theme: 'striped', styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 125 } }, headStyles: { fillColor: [49, 91, 78] }, rowPageBreak: 'avoid'
  });
  doc.addPage();
  doc.setFontSize(15); doc.text(pdfText(t.qr), 18, 22);
  const qr = await QRCode.toDataURL(encodeTransfer(answers, includeContext), { width: 640, margin: 4, errorCorrectionLevel: 'M' });
  doc.addImage(qr, 'PNG', 50, 35, 110, 110);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(pdfText(`${includeContext ? t.contextIncluded : t.contextExcluded} ${t.exportHint}`), width), 18, 158);
  doc.text(doc.splitTextToSize(pdfText(t.notMedical), width), 18, 185);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFontSize(8); doc.text(`NDee - ${page}/${pages}`, 18, 288);
  }
  return doc;
}
