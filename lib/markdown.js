import fs from 'node:fs/promises';
import path from 'node:path';
import { ANSWER_KEY } from './answer-key.js';

const BANK_PATH = path.join(process.cwd(), 'bank-soal-rpl-online.md');

function normalizeWhitespace(value) {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function parseQuestionBlock(block, answerKey = {}) {
  const lines = block.split('\n').map((line) => line.trimEnd());
  const header = lines.shift() ?? '';
  const match = header.match(/^###\s*(\d+)\.\s*(.*)$/);
  if (!match) {
    return null;
  }

  const number = Number(match[1]);
  const headerText = match[2].trim();
  const type = headerText.toLowerCase().includes('pilih semua') ? 'multi' : 'single';
  const options = [];
  const stemLines = [];
  let inExplanation = false;
  let explanationLines = [];

  for (const line of lines) {
    const value = line.trim();
    if (!value) {
      if (!inExplanation) {
        stemLines.push('');
      } else {
        explanationLines.push('');
      }
      continue;
    }

    if (/^\*\*Penjelasan:\*\*/i.test(value) || /^\*\*Pembahasan:\*\*/i.test(value)) {
      inExplanation = true;
      continue;
    }

    const singleOption = value.match(/^([A-E])\.\s*(.+)$/);
    const multiOption = value.match(/^\[\s?\]\s*(.+)$/);
    if (singleOption && !inExplanation) {
      options.push({
        label: singleOption[1],
        text: singleOption[2].trim()
      });
      continue;
    }

    if (multiOption && !inExplanation) {
      options.push({
        label: String.fromCharCode(65 + options.length),
        text: multiOption[1].trim()
      });
      continue;
    }

    if (inExplanation) {
      explanationLines.push(value);
    } else {
      stemLines.push(value);
    }
  }

  const answerLabels = answerKey[number] ?? [];
  const stem = normalizeWhitespace(stemLines.join('\n'));
  const explanation = normalizeWhitespace(explanationLines.join('\n').replace(/^\*\*Pembahasan:\*\*/i, ''));

  return {
    id: `q-${number}`,
    number,
    type,
    headerText,
    stem,
    explanation,
    options,
    answerLabels
  };
}

function extractBlocks(sectionText) {
  const blocks = [];
  const regex = /###\s*\d+\.[\s\S]*?(?=\n###\s*\d+\.|\n##\s|$)/g;
  const matches = sectionText.match(regex) ?? [];
  for (const match of matches) {
    blocks.push(match.trim());
  }
  return blocks;
}

function parseMeta(text) {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? 'Bank Soal';
  const program = text.match(/\*\*Program Studi:\*\*\s*(.+)$/m)?.[1]?.trim() ?? '';
  const faculty = text.match(/\*\*Fakultas:\*\*\s*(.+)$/m)?.[1]?.trim() ?? '';
  const university = text.match(/\*\*Universitas:\*\*\s*(.+)$/m)?.[1]?.trim() ?? '';
  const course = text.match(/\*\*Mata Kuliah:\*\*\s*(.+)$/m)?.[1]?.trim() ?? '';
  const target = text.match(/\*\*Target:\*\*\s*(.+)$/m)?.[1]?.trim() ?? '';

  return {
    title,
    program,
    faculty,
    university,
    course,
    target,
    slug: slugify(title)
  };
}

export async function loadMarkdownText(filePath = BANK_PATH) {
  return fs.readFile(filePath, 'utf8');
}

export async function parseMarkdownBank(filePath = BANK_PATH) {
  const text = await loadMarkdownText(filePath);
  const meta = parseMeta(text);
  const sections = text.split('## Soal Centang Lebih Dari Satu');
  const singleSection = sections[0] ?? text;
  const multiSection = sections[1] ?? '';
  const fileName = path.basename(filePath);
  const answerKey = ANSWER_KEY[fileName] ?? {};

  const questionBlocks = [
    ...extractBlocks(singleSection),
    ...extractBlocks(multiSection)
  ];

  const questions = questionBlocks
    .map((block) => parseQuestionBlock(block, answerKey))
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  return {
    id: meta.slug,
    ...meta,
    totalQuestions: questions.length,
    questions
  };
}
