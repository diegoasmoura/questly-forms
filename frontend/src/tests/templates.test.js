import { describe, it, expect } from 'vitest';
import { clinicalTemplates } from '../lib/templates';

describe('Clinical Templates', () => {
  it('should have the YSQ-L3 template', () => {
    const ysq = clinicalTemplates.find(t => t.id === 'ysq_l3');
    expect(ysq).toBeDefined();
    expect(ysq.title).toContain('YSQ-L3');
  });

  it('should have new Anamnese templates', () => {
    const anamneseIds = ['anamnese_adulto', 'anamnese_infantil', 'anamnese_adolescente', 'anamnese_idoso', 'anamnese_psicanalitica', 'anamnese_humanista'];
    anamneseIds.forEach(id => {
      const template = clinicalTemplates.find(t => t.id === id);
      expect(template).toBeDefined();
      expect(template.type).toBe('Anamnese');
      expect(template.schema.pages.length).toBeGreaterThan(0);
    });
  });

  it('should have CBT (TCC) and Behavioral templates', () => {
    const cbt = clinicalTemplates.find(t => t.id === 'rpd_tcc');
    expect(cbt).toBeDefined();
    expect(cbt.type).toBe('Acompanhamento');

    const abc = clinicalTemplates.find(t => t.id === 'registro_abc_comportamental');
    expect(abc).toBeDefined();
    expect(abc.type).toBe('Acompanhamento');
  });

  it('should have new psychometric scales', () => {
    const scaleIds = ['dass21', 'bdi_ii', 'bai', 'asrs18'];
    scaleIds.forEach(id => {
      const template = clinicalTemplates.find(t => t.id === id);
      expect(template).toBeDefined();
      expect(template.type).toBe('Avaliação');
      expect(template.schema.pages[0].questions.length).toBeGreaterThan(0);
    });
  });

  it('all templates should have required schema structure', () => {
    clinicalTemplates.forEach(template => {
      expect(template.id).toBeDefined();
      expect(template.title).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.schema).toBeDefined();
      expect(Array.isArray(template.schema.pages)).toBe(true);
      template.schema.pages.forEach(page => {
        expect(page.title).toBeDefined();
        expect(Array.isArray(page.questions)).toBe(true);
        page.questions.forEach(q => {
          expect(q.id).toBeDefined();
          expect(q.type).toBeDefined();
          expect(q.title).toBeDefined();
        });
      });
    });
  });
});
