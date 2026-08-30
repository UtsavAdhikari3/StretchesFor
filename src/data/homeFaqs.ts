export interface HomeFaq {
  question: string;
  paragraphs: string[];
  items?: string[];
  relatedLink?: {
    href: string;
    label: string;
  };
}

export const homeFaqs: HomeFaq[] = [
  {
    question: 'What are 10 stretches I can do daily?',
    paragraphs: [
      'A balanced daily mobility routine can cover the neck, shoulders, chest, spine, hips, thighs, calves, and ankles. Try these 10 gentle movements:',
    ],
    items: [
      'Gentle chin tuck',
      'Lateral neck stretch',
      'Supported shoulder pendulum',
      'Low doorway chest opener',
      'Open-book rotation',
      'Pelvic tilt',
      'Supported hip-flexor stretch',
      'Standing quadriceps stretch',
      'Runner’s calf stretch',
      'Controlled ankle circles',
    ],
    relatedLink: { href: '/exercises/', label: 'Browse step-by-step exercise guides' },
  },
  {
    question: 'What are the top 5 stretches for lower back pain?',
    paragraphs: [
      'There is no universal “top five” because lower back pain has many possible causes. For mild, movement-related stiffness, common gentle options are:',
    ],
    items: [
      'Pelvic tilts',
      'Single knee-to-chest stretches',
      'Lower-trunk rotations with the knees moving side to side',
      'Cat-cow movements in a comfortable range',
      'A supported child’s pose',
    ],
    relatedLink: { href: '/stretches-for-lower-back-pain/', label: 'See the lower back pain guide and safety checks' },
  },
  {
    question: 'How to relieve a tight lower back pain?',
    paragraphs: [
      'Change position, take a short gentle walk, and try small, comfortable back movements instead of staying in bed for long periods. A warm pack may help some people; follow its instructions and protect your skin. Stop any movement that makes pain stronger or causes pain, tingling, numbness, or weakness to spread into a leg.',
      'Seek prompt medical advice after a significant injury, for severe or rapidly worsening pain, fever or unexplained illness, new weakness or numbness, loss of bladder or bowel control, or numbness around the groin or saddle area.',
    ],
    relatedLink: { href: '/body/lower-back/', label: 'Explore the lower back starting guide' },
  },
  {
    question: 'What is a 10 stretch?',
    paragraphs: [
      '“10 stretch” is not a standard exercise term. It may mean a 10-second stretch or a routine containing 10 stretches. If you mean a 10-second hold, that can be a comfortable starting point; static stretches are commonly held for about 10–30 seconds. Breathe normally, avoid bouncing, and aim for mild tension rather than pain.',
    ],
  },
  {
    question: 'What is the best everyday exercise?',
    paragraphs: [
      'There is no single best exercise for everyone, but walking is a practical everyday choice because it is accessible, adjustable, and easy to repeat. For more complete fitness, combine regular aerobic activity with strength work for the major muscle groups on at least two days a week, plus mobility and balance work as appropriate. Start with an amount you can recover from and build gradually.',
    ],
  },
  {
    question: 'Is it better to stretch or relax a pulled muscle?',
    paragraphs: [
      'Early after a suspected muscle strain, protect the area and stop activities that increase pain, swelling, or discomfort. Light movement is reasonable if it does not worsen symptoms, but do not force a static stretch into a newly injured muscle. As pain and swelling settle, gradual movement, strength, and flexibility work can be reintroduced; a clinician or physiotherapist can guide recovery after a more serious strain.',
    ],
  },
  {
    question: 'What not to do with a pulled muscle?',
    paragraphs: [
      'Do not push through sharp pain, repeatedly test the injury, force a deep stretch, or return immediately to running, heavy lifting, or sport. Avoid heat, alcohol, and massage for the first couple of days if the injury is newly swollen or bruised. Do not ignore a pop, visible deformity, major swelling, loss of strength, inability to use the area normally, or symptoms that keep worsening.',
    ],
  },
  {
    question: 'Should I massage a pulled muscle?',
    paragraphs: [
      'Avoid massaging a new strain during the first couple of days, especially when there is swelling or bruising, because early massage may increase bleeding and swelling. Later, gentle massage may feel soothing, but it should not be painful and does not replace progressive rehabilitation. Ask a qualified clinician first if the injury is severe, the diagnosis is uncertain, or normal function is limited.',
    ],
  },
];

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function getHomeFaqSchema() {
  return {
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: [
          ...faq.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
          faq.items
            ? `<ol>${faq.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
            : '',
        ].join(''),
      },
    })),
  };
}
