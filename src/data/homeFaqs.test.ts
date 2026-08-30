import { describe, expect, it } from 'vitest';
import { getHomeFaqSchema, homeFaqs } from './homeFaqs';

describe('homepage FAQs', () => {
  it('keeps visible questions unique and complete', () => {
    expect(homeFaqs).toHaveLength(8);
    expect(new Set(homeFaqs.map((faq) => faq.question)).size).toBe(homeFaqs.length);
    expect(homeFaqs.every((faq) => faq.paragraphs.join(' ').length > 80)).toBe(true);
  });

  it('creates matching FAQPage JSON-LD', () => {
    const schema = getHomeFaqSchema();

    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(homeFaqs.length);
    schema.mainEntity.forEach((question, index) => {
      expect(question.name).toBe(homeFaqs[index].question);
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text).toContain(homeFaqs[index].paragraphs[0]);
    });
  });
});
