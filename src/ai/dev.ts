
import { config } from 'dotenv';
config();

import './flows/restructure-messy-pdf.ts';
import './flows/generate-quiz-questions.ts';
import './flows/suggest-missing-content.ts';
import './flows/audit-course.ts';
import './flows/schemas.ts';
    