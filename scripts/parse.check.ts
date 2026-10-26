import assert from 'node:assert/strict'
import { COLUMNS, RATING_IDS } from '../src/schema'
import { parseResponseText, nameFromFilename, mergeRows } from '../src/lib/parse'
import { wordsToText } from '../src/lib/ocr'

const courseLabels = [
  'Relevance to your current work',
  'Relevance to your future / desired work',
  "Relevance to your institution's / agency's needs",
  'Amount of information covered in the course / training / seminar',
  'Extent to which you gained ideas useful to you work',
  'Extent to which you have acquired new skills',
  'Extent that this course / training / seminar achieved its objectives',
  'Effectiveness of the course / training / seminar in maintaining your interest from start to finish',
  'Effectiveness of the visual aids in reinforcing the lessons',
  'Adequacy of time allotted to each topics',
  'Logic in the progression or sequence of topics',
  'Time allotted for discussions and Q and A',
  'Variety of the training methods used (lectures, exercises, discussion, examination / assessment)',
  'Effectiveness of the resource person / instructor in training you to use and appreciate application / subject',
  'Responsiveness of the resource person / instructor in answering participant/s questions / queries',
  'Interaction between participants and resource person / instructor',
]

const resourceLabels = [
  'Knowledge about the subject matter',
  'Presents topics in a well-organized manner',
  'Injects current developments relevant to the course / training',
  'Uses notes wisely',
  'Able to explain theories and concepts clearly',
  'Gives adequate exercises / assignments',
  'Utilizes instructional materials effectively',
  'Encourages participants to raise questions',
  'Makes use of time efficiently',
  'Projects a clear and audible voice',
  'Expresses his / her ideas clearly, fluently, and spontaneously',
  'Able to inspire and maintain the participant’s interest',
  'Willingness to help in the participant’s course / training related problems',
  'Open to criticism and gives / accepts alternative',
  'Able to maintain class / classroom discipline and control',
  'Follows the time duration (class hours)',
  'Dresses neatly and appropriately',
  'Courteous in answering the participant’s questions / queries',
  'Projects image of authority',
]

const labelled = `ICT Literacy and Competency Development Bureau
PARTICIPANTS NAME: Maria Kristine T. Valdez
Email Address: maria@example.gov.ph
REGION: REGION II - CAGAYAN VALLEY
AGE: 31 - 40
GENDER: FEMALE
CITIZENSHIP: Filipino
Social Category: Local Government Unit
Timestamp: 2026-08-20 09:12:33

I. RELEVANCE OF THE TRAINING
${courseLabels.slice(0, 3).map((l, i) => `${i + 1}. ${l}\n${5 - (i === 2 ? 1 : 0)}`).join('\n')}
II. INFORMATION / SKILLS ACQUIRED
${courseLabels.slice(3, 7).map((l, i) => `${i + 1}. ${l}\n5`).join('\n')}
III. INSTRUCTIONAL DESIGN
${courseLabels.slice(7, 13).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
IV. CLASS INTERACTION
${courseLabels.slice(13).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
V. SENSITIVITY AND ASSISTANCE PROVIDED BY THE TRAINING STAFF
5
VI. IN GENERAL, HOW WOULD YOU RATE THIS COURSE / TRAINING / SEMINAR
5

1. What did you find most useful his course / training / seminar?
The hands-on exercises.
They were practical.
2. What did you find least useful in this course / training / seminar?
N/A
3. On which topics, if any, would you rather have spent more time?
Gemini Notebook
4. On which topics, if any, would you rather have spent less time?
N/A
5. What advice can you give to improve the future conduct of this course / training / seminar?
Keep the same trainers.
6. Could you recommend this course / training / seminar to your colleagues?
Yes
7. Please list three (3) things that you intend to do as a result of your participation in this course / training / seminar
1. Train my office
2. Share the materials
3. Review the workflows
8. Comments and / or Suggestions.
Thank you.

I . MASTERY OF THE SUBJECT MATTER
${resourceLabels.slice(0, 4).map((l, i) => `${i + 1}. ${l}\n5`).join('\n')}
II . INSTRUCTIONAL METHODOLOGY
${resourceLabels.slice(4, 9).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
III. COMMUNICATIONS SKILLS
${resourceLabels.slice(9, 11).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
IV. CLASS / CLASSROOM MANAGEMENT
${resourceLabels.slice(11, 15).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
V. PERSONAL QUALITIES
${resourceLabels.slice(15).map((l, i) => `${i + 1}. ${l}\n4`).join('\n')}
OTHER COMMENTS
Strong session.
`

const bare = `PARTICIPANTS NAME: Juan Dela Cruz
Email Address: juan@example.gov.ph
REGION: REGION II - CAGAYAN VALLEY
AGE: 20 - 30
GENDER: MALE
CITIZENSHIP: PHL
Social Category: Local Government Unit

I. RELEVANCE OF THE TRAINING
5
5
4
II. INFORMATION / SKILLS ACQUIRED
4
4
4
4
III. INSTRUCTIONAL DESIGN
4
4
4
4
4
4
IV. CLASS INTERACTION
4
4
4
V. SENSITIVITY AND ASSISTANCE PROVIDED BY THE TRAINING STAFF
4
VI. IN GENERAL, HOW WOULD YOU RATE THIS COURSE / TRAINING / SEMINAR
4
I . MASTERY OF THE SUBJECT MATTER
4
4
4
4
II . INSTRUCTIONAL METHODOLOGY
4
4
4
4
4
III. COMMUNICATIONS SKILLS
4
4
IV. CLASS / CLASSROOM MANAGEMENT
4
4
4
4
V. PERSONAL QUALITIES
4
4
4
4
`

const exact = `PARTICIPANTS NAME: Ana Cruz
Email Address: ana@example.gov.ph
I. RELEVANCE OF THE TRAINING [1. Relevance to your current work]: 5
I. RELEVANCE OF THE TRAINING [2. Relevance to your future / desired work]: 4
I. RELEVANCE OF THE TRAINING [3. Relevance to your institution's / agency's needs]: 5
`

const wrapped = `PARTICIPANTS NAME: Liza Manalo
Data Privacy Consent: AGREE
Email Address: liza@example.gov.ph
Social Category: (Choose all that apply): Local Government Unit

1. What did you find most useful his course / training /
seminar? The hands-on mapping session.
2. What did you find least useful in this course / training / seminar?
N/A
7. Please list three (3) things that you intend to do as a result of
your participation in this course / training / seminar
1. Share the maps
2. Train two staff
3. Review the data
8. Comments and / or Suggestions. Clear venue and helpful staff.
Liza Manalo

Resource Person Evaluation
I . MASTERY OF THE SUBJECT MATTER
1. Knowledge about the subject matter
5

OTHER COMMENTS
Well run.
Liza Manalo
`

assert.equal(COLUMNS.length, 55)
assert.ok(COLUMNS[2].header.startsWith('IMPORTANT:\n\nPer Section 2(Declaration of Policy)'))
assert.equal(
  COLUMNS[9].header,
  'I. RELEVANCE OF THE TRAINING [1. Relevance to your current work]',
)
assert.equal(COLUMNS[54].header, 'OTHER COMMENTS')

const [row] = parseResponseText(labelled, 'Evaluation - Maria Kristine T. Valdez.pdf')
assert.equal(row.values.name, 'Maria Kristine T. Valdez')
assert.equal(row.values.email, 'maria@example.gov.ph')
assert.equal(row.values.region, 'REGION II - CAGAYAN VALLEY')
assert.equal(row.values.course1, '5')
assert.equal(row.values.course3, '4')
assert.equal(row.values.course4, '5')
assert.equal(row.values.course13, '4')
assert.equal(row.values.course18, '5')
assert.equal(row.values.question1, 'The hands-on exercises.\nThey were practical.')
assert.equal(row.values.question3, 'Gemini Notebook')
assert.equal(row.values.question7, '1. Train my office\n2. Share the materials\n3. Review the workflows')
assert.equal(row.values.question8, 'Thank you.')
assert.equal(row.values.resource1, '5')
assert.equal(row.values.resource19, '4')
assert.equal(row.values.otherComments, 'Strong session.')
assert.equal(row.low.name, undefined)
assert.equal(row.low.course1, undefined)
assert.equal(Object.keys(row.low).length, 0, `unexpected flags: ${Object.keys(row.low).join(', ')}`)

const [guessed] = parseResponseText(bare)
assert.equal(guessed.values.name, 'Juan Dela Cruz')
assert.equal(guessed.values.course1, '5')
assert.equal(guessed.values.course3, '4')
assert.equal(guessed.values.course18, '4')
assert.equal(guessed.values.resource19, '4')
assert.equal(guessed.low.course1, 'guess')
assert.equal(guessed.low.resource19, 'guess')

const [inline] = parseResponseText(exact)
assert.equal(inline.values.course1, '5')
assert.equal(inline.values.course2, '4')
assert.equal(inline.values.course3, '5')

const [wrappedRow] = parseResponseText(wrapped, 'Evaluation - Liza Manalo.pdf')
assert.equal(wrappedRow.values.consent, 'AGREE')
assert.equal(wrappedRow.values.socialCategory, 'Local Government Unit')
assert.equal(wrappedRow.values.question1, 'The hands-on mapping session.')
assert.equal(
  wrappedRow.values.question7,
  '1. Share the maps\n2. Train two staff\n3. Review the data',
)
assert.equal(wrappedRow.values.question8, 'Clear venue and helpful staff.')
assert.equal(wrappedRow.values.otherComments, 'Well run.')
assert.equal(wrappedRow.low.question1, undefined)

const two = parseResponseText(`${labelled}\n${labelled.replace('Maria Kristine T. Valdez', 'Second Person')}`)
assert.equal(two.length, 2)
assert.equal(two[1].values.name, 'Second Person')

assert.equal(nameFromFilename('Evaluation Form - Juan Dela Cruz.pdf'), 'Juan Dela Cruz')
const [fallback] = parseResponseText('Email Address: x@y.ph\nREGION: REGION II', 'Evaluation Form - Juan Dela Cruz.pdf')
assert.equal(fallback.values.name, 'Juan Dela Cruz')
assert.equal(fallback.low.name, 'guess')

const word = (text: string, x0: number, y0: number) => ({
  text,
  bbox: { x0, y0, x1: x0 + text.length * 10, y1: y0 + 20 },
})
const words = [
  word('PARTICIPANTS', 0, 0), word('NAME:', 130, 2), word('Rosa', 400, 0), word('Lim', 450, 1),
  word('1.', 300, 60), word('Knowledge', 350, 61), word('about', 450, 60), word('the', 510, 60),
  word('subject', 550, 59), word('matter', 630, 60), word('5', 1200, 62),
  word('I.', 0, 80), word('MASTERY', 30, 80), word('OF', 120, 80), word('THE', 150, 80), word('SUBJECT', 190, 80),
  word('2.', 300, 100), word('Uses', 350, 100), word('notes', 400, 101), word('wisely', 460, 99),
  word('4', 1200, 100), word('Very', 1300, 100), word('Satisfactory', 1350, 100),
]
const ocrText = wordsToText(words)
assert.match(ocrText, /^PARTICIPANTS NAME:\tRosa Lim\n1\. Knowledge about the subject matter\t5\n/)
const [ocrRow] = parseResponseText(`${ocrText}\nI. MASTERY OF THE SUBJECT\t1.\tKnowledge about the subject matter\t3`)
assert.equal(ocrRow.values.name, 'Rosa Lim')
assert.equal(ocrRow.values.resource1, '3')
assert.equal(ocrRow.values.resource4, '4')
assert.equal(ocrRow.low.resource4, undefined)

for (const id of RATING_IDS.courseRatings.concat(RATING_IDS.resource))
  assert.ok(row.values[id], `missing rating ${id}`)

const [one] = mergeRows([
  { id: 'a', source: 'course.pdf', values: { name: 'Juan Dela Cruz', course1: '5', resource1: '' }, low: { resource1: 'missing', resource2: 'missing' } },
  { id: 'b', source: 'resource.pdf', values: { name: 'DELA CRUZ, JUAN', course1: '3', resource1: '4' }, low: { course1: 'guess', resource2: 'missing' } },
])
assert.equal(one.source, 'course.pdf + resource.pdf')
assert.deepEqual([one.values.course1, one.values.resource1], ['5', '4'])
assert.deepEqual(one.low, { resource2: 'missing' })
assert.equal(mergeRows([{ ...one, values: { name: '' } }, { ...one, values: { name: '' } }]).length, 2)

console.log(`ok — ${COLUMNS.length} headers, ${RATING_IDS.courseRatings.length + RATING_IDS.resource.length} marks, 9 parser cases`)