import type { QuizQuestion } from './types';

// A self-contained sample so a brand-new user can take a real quiz in seconds
// without uploading anything. The questions are bundled (not AI-generated), so
// the round loads instantly and costs nothing.

export const SAMPLE_TITLE = 'Sample: Photosynthesis';

export const SAMPLE_CONTENT = `Photosynthesis is the process plants, algae, and some bacteria use to convert light energy into chemical energy stored as glucose. It is the foundation of nearly every food chain on Earth and the source of most of the oxygen in our atmosphere.

The overall reaction can be summarized as: six molecules of carbon dioxide plus six molecules of water, using light energy, produce one molecule of glucose plus six molecules of oxygen (6 CO2 + 6 H2O + light -> C6H12O6 + 6 O2).

Photosynthesis takes place in organelles called chloroplasts, found mainly in the cells of leaves. Chloroplasts contain a green pigment called chlorophyll, which absorbs light most strongly in the red and blue parts of the spectrum and reflects green light, which is why most plants appear green.

The process happens in two connected stages. The light-dependent reactions occur in the thylakoid membranes. There, absorbed light energy splits water molecules (a step called photolysis), releasing oxygen as a byproduct and producing the energy carriers ATP and NADPH.

The second stage, the Calvin cycle, takes place in the stroma, the fluid surrounding the thylakoids. It does not require light directly. Instead, it uses the ATP and NADPH from the first stage to "fix" carbon dioxide from the air into glucose.

Because plants make their own food from inorganic raw materials, they are called autotrophs, or producers. Organisms that must consume others for energy are called heterotrophs.`;

export const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    question: 'What is the main purpose of photosynthesis?',
    kind: 'multiple_choice',
    options: [
      'To convert light energy into chemical energy stored as glucose',
      'To break down glucose to release energy',
      'To absorb oxygen from the air',
      'To remove water from the soil',
    ],
    correctIndex: 0,
    explanations: [
      'Correct — photosynthesis stores light energy as chemical energy in glucose.',
      'That describes cellular respiration, which breaks glucose down.',
      'Plants release oxygen during photosynthesis; they do not absorb it here.',
      'Water is an input, but removing it is not the purpose.',
    ],
  },
  {
    question: 'In which organelle does photosynthesis take place?',
    kind: 'multiple_choice',
    options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome'],
    correctIndex: 1,
    explanations: [
      'Mitochondria carry out respiration, not photosynthesis.',
      'Correct — chloroplasts contain chlorophyll and host both stages.',
      'The nucleus stores DNA; it is not where photosynthesis happens.',
      'Ribosomes build proteins.',
    ],
  },
  {
    question: 'Which gas is released as a byproduct of photosynthesis?',
    kind: 'multiple_choice',
    options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'],
    correctIndex: 2,
    explanations: [
      'Carbon dioxide is an input, not a byproduct.',
      'Nitrogen is not involved in the core reaction.',
      'Correct — oxygen is released when water is split in the light reactions.',
      'Hydrogen ends up in NADPH and glucose, not released as a gas.',
    ],
  },
  {
    question: 'The green pigment that absorbs light for photosynthesis is called ____.',
    kind: 'fill_blank',
    options: [],
    correctIndex: -1,
    blankAnswer: 'chlorophyll',
    explanations: [
      'Chlorophyll absorbs red and blue light and reflects green, giving plants their color.',
    ],
  },
  {
    question: 'Photosynthesis releases carbon dioxide into the atmosphere.',
    kind: 'true_false',
    options: ['True', 'False'],
    correctIndex: 1,
    explanations: [
      'False — carbon dioxide is consumed (an input). Oxygen is released.',
      'Correct — CO2 is an input; oxygen is the gas released.',
    ],
  },
  {
    question: 'Where do the light-dependent reactions occur?',
    kind: 'multiple_choice',
    options: ['In the stroma', 'In the thylakoid membranes', 'In the cell wall', 'In the vacuole'],
    correctIndex: 1,
    explanations: [
      'The stroma hosts the Calvin cycle, not the light reactions.',
      'Correct — the thylakoid membranes capture light and split water.',
      'The cell wall provides structure, not energy capture.',
      'The vacuole stores fluid and waste.',
    ],
  },
  {
    question: 'What two energy carriers do the light-dependent reactions produce?',
    kind: 'multiple_choice',
    options: ['ATP and NADPH', 'DNA and RNA', 'Glucose and oxygen', 'Water and CO2'],
    correctIndex: 0,
    explanations: [
      'Correct — ATP and NADPH power the Calvin cycle.',
      'DNA and RNA are nucleic acids, not energy carriers here.',
      'Those are end products/byproducts, not the carriers passed between stages.',
      'Water and CO2 are inputs.',
    ],
  },
  {
    question: 'What does the Calvin cycle use to build glucose?',
    kind: 'multiple_choice',
    options: [
      'Carbon dioxide, plus ATP and NADPH',
      'Oxygen and sunlight directly',
      'Glucose and water',
      'Nitrogen from the soil',
    ],
    correctIndex: 0,
    explanations: [
      'Correct — it fixes CO2 using the ATP and NADPH from the light reactions.',
      'The Calvin cycle does not use light directly.',
      'Glucose is the product, not an input.',
      'Nitrogen is not part of the Calvin cycle.',
    ],
  },
  {
    question: 'Organisms that make their own food, like plants, are called ____.',
    kind: 'fill_blank',
    options: [],
    correctIndex: -1,
    blankAnswer: 'autotrophs',
    explanations: [
      'Autotrophs (producers) make food from inorganic materials; heterotrophs must consume others.',
    ],
  },
  {
    question: 'Why do most plants appear green?',
    kind: 'multiple_choice',
    options: [
      'Chlorophyll reflects green light while absorbing red and blue',
      'Plants emit green light',
      'Green light carries the most energy',
      'Soil minerals stain the leaves green',
    ],
    correctIndex: 0,
    explanations: [
      'Correct — green is the wavelength chlorophyll reflects rather than absorbs.',
      'Plants reflect, not emit, green light.',
      'Energy content is not why leaves look green.',
      'Leaf color comes from pigments, not soil.',
    ],
  },
  {
    question: 'In the equation 6 CO2 + 6 H2O + light -> C6H12O6 + 6 O2, what is C6H12O6?',
    kind: 'multiple_choice',
    options: ['Glucose', 'Water', 'Carbon dioxide', 'Chlorophyll'],
    correctIndex: 0,
    explanations: [
      'Correct — C6H12O6 is glucose, the sugar product.',
      'Water (H2O) is a reactant on the left.',
      'Carbon dioxide (CO2) is a reactant on the left.',
      'Chlorophyll is a pigment, not a product of the reaction.',
    ],
  },
  {
    question: 'Splitting water during the light reactions is called photolysis.',
    kind: 'true_false',
    options: ['True', 'False'],
    correctIndex: 0,
    explanations: [
      'Correct — "photo" (light) + "lysis" (splitting); it releases oxygen.',
      'It is true: photolysis is the light-driven splitting of water.',
    ],
  },
];
