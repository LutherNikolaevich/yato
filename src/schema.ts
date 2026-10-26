
export type ColumnType = 'text' | 'longtext' | 'email' | 'rating' | 'consent'
export type GroupId = 'particulars' | 'courseRatings' | 'courseComments' | 'resource' | 'other'

export interface Column {
  id: string
  header: string
  label: string
  group: GroupId
  type: ColumnType
  aliases: string[]
  width: number
}

export interface ColumnGroup {
  id: GroupId
  label: string
}

export const GROUPS: ColumnGroup[] = [
  { id: 'particulars', label: 'Particulars' },
  { id: 'courseRatings', label: 'Course ratings' },
  { id: 'courseComments', label: 'Comments' },
  { id: 'resource', label: 'Resource person' },
  { id: 'other', label: 'Other' },
]

const CONSENT =
  'IMPORTANT:\n\nPer Section 2(Declaration of Policy) of the Data Privacy Act of 2012, it is the policy of the State to protect the fundamental human right of privacy, of communication while ensuring free flow of information to promote innovation and growth. The State recognizes the vital role of information and communications technology in nation- building and its inherent obligation to ensure that personal information in information and communications systems in the government and in the private sector are secured and protected.\n\nAs such, information collected from this form shall be held in strict confidence and shall only be used solely for records keeping purposes.\n\nFalsification of any of the given information will automatically bar applicant from any ILCDB Course.\n\nParticipants should attend 100% of the  session to receive a certificate.'

const courseRatings: [string, string, string][] = [
  ['course1', 'Relevance to current work', 'I. RELEVANCE OF THE TRAINING [1. Relevance to your current work]'],
  [
    'course2',
    'Relevance to future work',
    'I. RELEVANCE OF THE TRAINING [2. Relevance to your future / desired work]',
  ],
  [
    'course3',
    "Relevance to agency's needs",
    "I. RELEVANCE OF THE TRAINING [3. Relevance to your institution's / agency's needs]",
  ],
  [
    'course4',
    'Amount of information',
    'II. INFORMATION / SKILLS ACQUIRED [1. Amount of information covered in the course / training / seminar]',
  ],
  [
    'course5',
    'Ideas useful to work',
    'II. INFORMATION / SKILLS ACQUIRED [2. Extent to which you gained ideas useful to you work]',
  ],
  [
    'course6',
    'New skills acquired',
    'II. INFORMATION / SKILLS ACQUIRED [3. Extent to which you have acquired new skills]',
  ],
  [
    'course7',
    'Objectives achieved',
    'II. INFORMATION / SKILLS ACQUIRED [4. Extent that this course / training / seminar achieved its objectives]',
  ],
  [
    'course8',
    'Maintained interest',
    'III. INSTRUCTIONAL DESIGN [1. Effectiveness of the course / training / seminar in maintaining your interest from start to finish]',
  ],
  [
    'course9',
    'Visual aids',
    'III. INSTRUCTIONAL DESIGN [2. Effectiveness of the visual aids in reinforcing the lessons]',
  ],
  [
    'course10',
    'Time per topic',
    'III. INSTRUCTIONAL DESIGN [3. Adequacy of time allotted to each topics]',
  ],
  [
    'course11',
    'Topic sequence',
    'III. INSTRUCTIONAL DESIGN [4. Logic in the progression or sequence of topics]',
  ],
  [
    'course12',
    'Discussion / Q&A time',
    'III. INSTRUCTIONAL DESIGN [5. Time allotted for discussions and Q and A]',
  ],
  [
    'course13',
    'Variety of methods',
    'III. INSTRUCTIONAL DESIGN [6. Variety of the training methods used (lectures, exercises, discussion, examination / assessment)]',
  ],
  [
    'course14',
    'Instructor effectiveness',
    'IV. CLASS INTERACTION [1. Effectiveness of the resource person / instructor in training you to use and appreciate application / subject]',
  ],
  [
    'course15',
    'Instructor responsiveness',
    'IV. CLASS INTERACTION [2. Responsiveness of the resource person / instructor in answering participant/s questions / queries]',
  ],
  [
    'course16',
    'Participant interaction',
    'IV. CLASS INTERACTION [3. Interaction between participants and resource person / instructor]',
  ],
  [
    'course17',
    'Training staff sensitivity',
    'V. SENSITIVITY AND ASSISTANCE PROVIDED BY THE TRAINING STAFF',
  ],
  [
    'course18',
    'Overall course rating',
    'VI. IN GENERAL, HOW WOULD YOU RATE THIS COURSE / TRAINING / SEMINAR',
  ],
]

const courseComments: [string, string, string][] = [
  ['question1', 'Most useful', '1. What did you find most useful his course / training / seminar?'],
  ['question2', 'Least useful', '2. What did you find least useful in this course / training / seminar?'],
  ['question3', 'More time on', '3. On which topics, if any, would you rather have spent more time?'],
  ['question4', 'Less time on', '4. On which topics, if any, would you rather have spent less time?'],
  [
    'question5',
    'Advice',
    '5. What advice can you give to improve the future conduct of this course / training / seminar?',
  ],
  [
    'question6',
    'Recommend to colleagues',
    '6. Could you recommend this course / training / seminar to your colleagues?',
  ],
  [
    'question7',
    'Three intended actions',
    '7. Please list three (3) things that you intend to do as a result of your participation in this course / training / seminar',
  ],
  ['question8', 'Comments / suggestions', '8. Comments and / or Suggestions.'],
]

const resourceRatings: [string, string, string][] = [
  [
    'resource1',
    'Knowledge of subject',
    'I . MASTERY OF THE SUBJECT MATTER [1.  Knowledge about the subject matter]',
  ],
  [
    'resource2',
    'Organized presentation',
    'I . MASTERY OF THE SUBJECT MATTER [2. Presents topics in a well-organized manner]',
  ],
  [
    'resource3',
    'Current developments',
    'I . MASTERY OF THE SUBJECT MATTER [3. Injects current developments relevant to the course / training]',
  ],
  [
    'resource4',
    'Uses notes wisely',
    'I . MASTERY OF THE SUBJECT MATTER [4. Uses notes wisely]',
  ],
  [
    'resource5',
    'Explains theories clearly',
    'II . INSTRUCTIONAL METHODOLOGY [1. Able to explain theories and concepts clearly]',
  ],
  [
    'resource6',
    'Adequate exercises',
    'II . INSTRUCTIONAL METHODOLOGY [2. Gives adequate exercises / assignments]',
  ],
  [
    'resource7',
    'Instructional materials',
    'II . INSTRUCTIONAL METHODOLOGY [3. Utilizes instructional materials effectively]',
  ],
  [
    'resource8',
    'Encourages questions',
    'II . INSTRUCTIONAL METHODOLOGY [4. Encourages participants to raise questions]',
  ],
  [
    'resource9',
    'Uses time efficiently',
    'II . INSTRUCTIONAL METHODOLOGY [5. Makes use of time efficiently]',
  ],
  [
    'resource10',
    'Clear, audible voice',
    'III. COMMUNICATIONS SKILLS [1.  Projects a clear and audible voice]',
  ],
  [
    'resource11',
    'Expresses ideas clearly',
    'III. COMMUNICATIONS SKILLS [2.  Expresses his / her ideas clearly, fluently, and spontaneously]',
  ],
  [
    'resource12',
    'Inspires interest',
    'IV. CLASS / CLASSROOM MANAGEMENT [1. Able to inspire and maintain the participant’s interest]',
  ],
  [
    'resource13',
    'Willing to help',
    'IV. CLASS / CLASSROOM MANAGEMENT [2. Willingness to help in the participant’s course / training related problems]',
  ],
  [
    'resource14',
    'Open to criticism',
    'IV. CLASS / CLASSROOM MANAGEMENT [3. Open to criticism and gives / accepts alternative]',
  ],
  [
    'resource15',
    'Maintains discipline',
    'IV. CLASS / CLASSROOM MANAGEMENT [4. Able to maintain class / classroom discipline and control]',
  ],
  [
    'resource16',
    'Follows schedule',
    'V. PERSONAL QUALITIES [1. Follows the time duration (class hours)]',
  ],
  [
    'resource17',
    'Dresses appropriately',
    'V. PERSONAL QUALITIES [2.  Dresses neatly and appropriately]',
  ],
  [
    'resource18',
    'Courteous',
    'V. PERSONAL QUALITIES [3. Courteous in answering the participant’s questions / queries]',
  ],
  [
    'resource19',
    'Projects authority',
    'V. PERSONAL QUALITIES [4. Projects image of authority]',
  ],
]

const ratingAliases: Record<string, string[]> = {
  course1: ['relevance to your current work'],
  course2: ['relevance to your future', 'relevance to future', 'desired work'],
  course3: ['relevance to your institution', 'relevance to institution', 'agency s needs'],
  course4: ['amount of information covered'],
  course5: ['extent to which you gained ideas useful', 'gained ideas useful', 'ideas useful to you work'],
  course6: ['extent to which you have acquired new skills', 'acquired new skills'],
  course7: ['extent that this course', 'achieved its objectives', 'achieved the objectives'],
  course8: [
    'effectiveness of the course training seminar in maintaining',
    'maintaining your interest',
    'maintain your interest',
  ],
  course9: ['effectiveness of the visual aids', 'visual aids'],
  course10: ['adequacy of time allotted', 'time allotted to each topics'],
  course11: ['logic in the progression', 'sequence of topics'],
  course12: ['time allotted for discussions', 'discussions and q and a'],
  course13: ['variety of the training methods'],
  course14: [
    'effectiveness of the resource person',
    'training you to use and appreciate',
  ],
  course15: ['responsiveness of the resource person'],
  course16: ['interaction between participants'],
  course17: ['sensitivity and assistance'],
  course18: ['in general how would you rate', 'how would you rate this course'],
  resource1: ['knowledge about the subject matter'],
  resource2: ['presents topics in a well organized manner', 'well organized manner'],
  resource3: ['injects current developments'],
  resource4: ['uses notes wisely'],
  resource5: ['able to explain theories'],
  resource6: ['gives adequate exercises'],
  resource7: ['utilizes instructional materials'],
  resource8: ['encourages participants to raise questions'],
  resource9: ['makes use of time efficiently'],
  resource10: ['projects a clear and audible voice'],
  resource11: ['expresses his her ideas clearly'],
  resource12: ['able to inspire and maintain'],
  resource13: ['willingness to help'],
  resource14: ['open to criticism'],
  resource15: ['able to maintain class'],
  resource16: ['follows the time duration'],
  resource17: ['dresses neatly'],
  resource18: ['courteous in answering'],
  resource19: ['projects image of authority'],
}

const questionAliases: Record<string, string[]> = {
  question1: ['what did you find most useful'],
  question2: ['what did you find least useful'],
  question3: [
    'on which topics if any would you rather have spent more time',
    'rather have spent more time',
  ],
  question4: [
    'on which topics if any would you rather have spent less time',
    'rather have spent less time',
  ],
  question5: ['what advice can you give'],
  question6: ['could you recommend this course'],
  question7: [
    'please list three 3 things',
    'three 3 things that you intend',
    'intend to do as a result',
    'list three 3 things',
  ],
  question8: ['comments and or suggestions', 'comments and suggestions'],
}

const withAliases = (
  rows: [string, string, string][],
  group: GroupId,
  type: ColumnType,
  width: number,
): Column[] =>
  rows.map(([id, label, header]) => ({
    id,
    header,
    label,
    group,
    type,
    aliases: ratingAliases[id] ?? questionAliases[id] ?? [label],
    width,
  }))

export const COLUMNS: Column[] = [
  {
    id: 'timestamp',
    header: 'Timestamp',
    label: 'Timestamp',
    group: 'particulars',
    type: 'text',
    aliases: ['timestamp', 'date submitted', 'submission time', 'date and time'],
    width: 21,
  },
  {
    id: 'email',
    header: 'Email Address',
    label: 'Email',
    group: 'particulars',
    type: 'email',
    aliases: ['email address', 'e mail address', 'email'],
    width: 30,
  },
  {
    id: 'consent',
    header: CONSENT,
    label: 'Data privacy consent',
    group: 'particulars',
    type: 'consent',
    aliases: ['declaration of policy', 'data privacy', 'consent'],
    width: 34,
  },
  {
    id: 'name',
    header: 'PARTICIPANTS NAME:',
    label: 'Participant',
    group: 'particulars',
    type: 'text',
    aliases: [
      'participants name',
      'participant s name',
      'participant name',
      'name of participant',
      'full name',
      'name',
    ],
    width: 28,
  },
  {
    id: 'region',
    header: 'REGION',
    label: 'Region',
    group: 'particulars',
    type: 'text',
    aliases: ['region'],
    width: 26,
  },
  {
    id: 'age',
    header: 'AGE',
    label: 'Age',
    group: 'particulars',
    type: 'text',
    aliases: ['age'],
    width: 12,
  },
  {
    id: 'gender',
    header: 'GENDER',
    label: 'Gender',
    group: 'particulars',
    type: 'text',
    aliases: ['gender', 'sex'],
    width: 12,
  },
  {
    id: 'citizenship',
    header: 'CITIZENSHIP',
    label: 'Citizenship',
    group: 'particulars',
    type: 'text',
    aliases: ['citizenship'],
    width: 14,
  },
  {
    id: 'socialCategory',
    header: 'Social Category: (Choose all that apply)',
    label: 'Social category',
    group: 'particulars',
    type: 'text',
    aliases: ['social category', 'choose all that apply'],
    width: 28,
  },
  ...withAliases(courseRatings, 'courseRatings', 'rating', 30),
  ...withAliases(courseComments, 'courseComments', 'longtext', 44),
  ...withAliases(resourceRatings, 'resource', 'rating', 30),
  {
    id: 'otherComments',
    header: 'OTHER COMMENTS',
    label: 'Other comments',
    group: 'other',
    type: 'longtext',
    aliases: ['other comments'],
    width: 44,
  },
]

export const COLUMN_BY_ID = new Map(COLUMNS.map(c => [c.id, c]))

export const RATING_IDS: Record<'courseRatings' | 'resource', string[]> = {
  courseRatings: courseRatings.map(r => r[0]),
  resource: resourceRatings.map(r => r[0]),
}

export interface Section {
  id: string
  title: string
  group: 'courseRatings' | 'resource'
  ids: string[]
}

export const SECTIONS: Section[] = [
  {
    id: 'course1',
    title: 'I. Relevance of the training',
    group: 'courseRatings',
    ids: ['course1', 'course2', 'course3'],
  },
  {
    id: 'course2',
    title: 'II. Information / skills acquired',
    group: 'courseRatings',
    ids: ['course4', 'course5', 'course6', 'course7'],
  },
  {
    id: 'course3',
    title: 'III. Instructional design',
    group: 'courseRatings',
    ids: ['course8', 'course9', 'course10', 'course11', 'course12', 'course13'],
  },
  {
    id: 'course4',
    title: 'IV. Class interaction',
    group: 'courseRatings',
    ids: ['course14', 'course15', 'course16'],
  },
  {
    id: 'course5',
    title: 'V. Sensitivity and assistance',
    group: 'courseRatings',
    ids: ['course17'],
  },
  {
    id: 'course6',
    title: 'VI. In general, how would you rate this course / training / seminar',
    group: 'courseRatings',
    ids: ['course18'],
  },
  {
    id: 'resource1',
    title: 'I. Mastery of the subject matter',
    group: 'resource',
    ids: ['resource1', 'resource2', 'resource3', 'resource4'],
  },
  {
    id: 'resource2',
    title: 'II. Instructional methodology',
    group: 'resource',
    ids: ['resource5', 'resource6', 'resource7', 'resource8', 'resource9'],
  },
  {
    id: 'resource3',
    title: 'III. Communications skills',
    group: 'resource',
    ids: ['resource10', 'resource11'],
  },
  {
    id: 'resource4',
    title: 'IV. Class / classroom management',
    group: 'resource',
    ids: ['resource12', 'resource13', 'resource14', 'resource15'],
  },
  {
    id: 'resource5',
    title: 'V. Personal qualities',
    group: 'resource',
    ids: ['resource16', 'resource17', 'resource18', 'resource19'],
  },
]

export const DEFAULT_FILENAME = 'Evaluation Form for Training (Responses).xlsx'

export const exportBase = (raw: string) =>
  (raw.trim().replace(/[\\/:*?"<>|]/g, '-') || DEFAULT_FILENAME).replace(/\.(xlsx|pdf)$/i, '')
