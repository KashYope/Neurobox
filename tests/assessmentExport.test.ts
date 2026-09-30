import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { REFLECTION_QUESTIONS, SCALE_LIMITS } from '../features/assessment/model';
import { encodeTransfer } from '../features/assessment/transfer';
import { createAssessmentPdf } from '../features/assessment/exportPdf';

const answers = REFLECTION_QUESTIONS.map(question => ({ questionId: question.id, score: SCALE_LIMITS[question.scale].max }));

test('full-size QR stays encodable with context included', () => {
  const qr = QRCode.create(encodeTransfer(answers, true), { errorCorrectionLevel: 'M' });
  assert.ok(qr.version < 20);
  assert.ok(qr.modules.size > 0);
});

test('PDF paginates both languages and includes sensitive context only on request', async () => {
  for (const locale of ['fr', 'en'] as const) {
    const doc = await createAssessmentPdf(answers, locale);
    const text = doc.output();
    assert.ok(doc.getNumberOfPages() >= 5);
    assert.ok(text.startsWith('%PDF-'));
    assert.equal(text.includes(locale === 'fr' ? 'pensées suicidaires' : 'suicidal ideation'), false);
    const contextDoc = await createAssessmentPdf(answers, locale, true);
    assert.equal(contextDoc.output().includes(locale === 'fr' ? 'pensées suicidaires' : 'suicidal ideation'), true);
  }
  const partial = await createAssessmentPdf([answers[7]], 'fr');
  assert.ok(partial.output().includes('Provisoire'));
});
