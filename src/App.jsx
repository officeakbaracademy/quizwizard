import { useCallback, useEffect, useMemo, useState } from 'react';

import FilterPanel from './components/FilterPanel';
import Header from './components/Header';
import MarkSchemeModal from './components/MarkSchemeModal';
import PdfProgressOverlay from './components/PdfProgressOverlay';
import PreviewModal from './components/PreviewModal';
import QuestionsTable from './components/QuestionsTable';
import StatsGrid from './components/StatsGrid';
import WorksheetModal from './components/WorksheetModal';
import WorksheetOptions from './components/WorksheetOptions';

import { useQuestionBank } from './hooks/useQuestionBank';
import {
  EMPTY_FILTERS,
  dependentOptions,
  filterQuestions,
  selectQuestionsForMarks,
  summariseBank,
  totalMarksOf,
  uniqueSyllabuses,
} from './lib/questionBank';

export default function App() {
  const {
    questions,
    loading,
    error,
    reload,
    getQuestionImages,
    getMarkSchemeImages,
    hasMarkScheme,
  } = useQuestionBank();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [targetMarks, setTargetMarks] = useState('');

  const [worksheetQuestions, setWorksheetQuestions] = useState([]);
  const [includeMarkSchemes, setIncludeMarkSchemes] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [markSchemeQuestion, setMarkSchemeQuestion] = useState(null);
  const [pdfProgress, setPdfProgress] = useState(null);

  // Show everything until the teacher narrows it down.
  useEffect(() => {
    setResults(questions);
  }, [questions]);

  const stats = useMemo(() => summariseBank(questions), [questions]);
  const syllabuses = useMemo(() => uniqueSyllabuses(questions), [questions]);
  const { papers, topics } = useMemo(
    () => dependentOptions(questions, filters.syllabus),
    [questions, filters.syllabus],
  );

  const selectedQuestions = useMemo(
    () => questions.filter((question) => selectedIds.has(question.id)),
    [questions, selectedIds],
  );

  const allFilteredSelected =
    results.length > 0 && results.every((question) => selectedIds.has(question.id));

  /* ---------------------------------------------------------------- */
  /* Filtering                                                         */
  /* ---------------------------------------------------------------- */

  const handleFilterChange = useCallback((key, value) => {
    setFilters((previous) => {
      // A new syllabus can invalidate the chosen paper and topic, so clear them.
      if (key === 'syllabus') {
        return { ...previous, syllabus: value, paper: '', topic: '' };
      }
      return { ...previous, [key]: value };
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    setResults(filterQuestions(questions, filters));
  }, [questions, filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setResults(questions);
  }, [questions]);

  const handleSortByMarks = useCallback(() => {
    setResults((previous) => [...previous].sort((a, b) => b.marks - a.marks));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Selection                                                         */
  /* ---------------------------------------------------------------- */

  const handleToggleQuestion = useCallback((questionId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked) => {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        results.forEach((question) => {
          if (checked) next.add(question.id);
          else next.delete(question.id);
        });
        return next;
      });
    },
    [results],
  );

  /* ---------------------------------------------------------------- */
  /* Worksheet generation                                              */
  /* ---------------------------------------------------------------- */

  const handleGenerateByMarks = useCallback(() => {
    const target = parseInt(targetMarks, 10);

    if (!target || target <= 0) {
      window.alert('Please enter a valid number of marks');
      return;
    }

    if (results.length === 0) {
      window.alert('No questions available. Please adjust your filters.');
      return;
    }

    const selected = selectQuestionsForMarks(results, target);

    if (selected.length === 0) {
      window.alert('Could not find questions matching the target marks. Try a higher number.');
      return;
    }

    setWorksheetQuestions(selected);
  }, [targetMarks, results]);

  const handleGenerateFromSelection = useCallback(() => {
    if (selectedQuestions.length === 0) {
      window.alert('Please select at least one question using the checkboxes');
      return;
    }
    setWorksheetQuestions(selectedQuestions);
  }, [selectedQuestions]);

  const handleCloseWorksheet = useCallback(() => setWorksheetQuestions([]), []);

  /* ---------------------------------------------------------------- */
  /* PDF downloads                                                     */
  /* ---------------------------------------------------------------- */

  const handleDownloadWorksheet = useCallback(async () => {
    setPdfProgress({ icon: '📄', message: 'Preparing PDF...' });
    try {
      // jsPDF is a large dependency, so it only loads when a download starts.
      const { downloadWorksheetPdf } = await import('./lib/pdf/worksheetPdf');
      await downloadWorksheetPdf({
        questions: worksheetQuestions,
        getQuestionImages,
        getMarkSchemeImages,
        includeMarkSchemes,
        onProgress: (message) => setPdfProgress({ icon: '📄', message }),
      });
    } catch (pdfError) {
      console.error('Worksheet PDF generation error:', pdfError);
      window.alert(`Unable to download the worksheet PDF. Please try again.\n\n${pdfError?.message ?? ''}`);
    } finally {
      setPdfProgress(null);
    }
  }, [worksheetQuestions, getQuestionImages, getMarkSchemeImages, includeMarkSchemes]);

  const handleDownloadMarkScheme = useCallback(async () => {
    setPdfProgress({ icon: '📝', message: 'Preparing mark scheme PDF...' });
    try {
      const { downloadMarkSchemePdf } = await import('./lib/pdf/markSchemePdf');
      await downloadMarkSchemePdf({
        questions: worksheetQuestions,
        getMarkSchemeImages,
        onProgress: (message) => setPdfProgress({ icon: '📝', message }),
      });
    } catch (pdfError) {
      console.error('Markscheme PDF generation error:', pdfError);
      window.alert(`Unable to download the mark scheme PDF. Please try again.\n\n${pdfError?.message ?? ''}`);
    } finally {
      setPdfProgress(null);
    }
  }, [worksheetQuestions, getMarkSchemeImages]);

  /* ---------------------------------------------------------------- */

  const resultsLabel = loading
    ? 'Loading questions...'
    : `${results.length} questions found (${totalMarksOf(results)} marks total)`;

  return (
    <>
      <div className="container">
        <Header />

        <StatsGrid
          totalQuestions={stats.totalQuestions}
          papers={stats.papers}
          topics={stats.topics}
          totalMarks={stats.totalMarks}
        />

        <div className="controls">
          <FilterPanel
            filters={filters}
            syllabuses={syllabuses}
            papers={papers}
            topics={topics}
            onChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          <WorksheetOptions
            targetMarks={targetMarks}
            onTargetMarksChange={setTargetMarks}
            onGenerateByMarks={handleGenerateByMarks}
            selectedCount={selectedQuestions.length}
            selectedMarks={totalMarksOf(selectedQuestions)}
            onGenerateFromSelection={handleGenerateFromSelection}
          />
        </div>

        <div className="results-header">
          <div className="results-count" id="resultsCount">
            {resultsLabel}
          </div>
          <div>
            <button
              type="button"
              className="btn-secondary"
              style={{ maxWidth: '300px', width: '100%' }}
              onClick={handleSortByMarks}
            >
              Sort by Marks
            </button>
          </div>
        </div>

        {error ? (
          <div className="table-container">
            <p className="no-results">
              Could not load the question bank.{' '}
              <button type="button" className="btn-secondary" onClick={reload}>
                Try again
              </button>
            </p>
          </div>
        ) : (
          <QuestionsTable
            questions={results}
            selectedIds={selectedIds}
            allSelected={allFilteredSelected}
            onToggleQuestion={handleToggleQuestion}
            onToggleSelectAll={handleToggleSelectAll}
            onPreview={setPreviewQuestion}
            onViewMarkScheme={setMarkSchemeQuestion}
            hasMarkScheme={hasMarkScheme}
          />
        )}
      </div>

      <WorksheetModal
        questions={worksheetQuestions}
        includeMarkSchemes={includeMarkSchemes}
        onIncludeMarkSchemesChange={setIncludeMarkSchemes}
        getQuestionImages={getQuestionImages}
        getMarkSchemeImages={getMarkSchemeImages}
        onDownloadWorksheet={handleDownloadWorksheet}
        onDownloadMarkScheme={handleDownloadMarkScheme}
        onClose={handleCloseWorksheet}
      />

      <PreviewModal
        question={previewQuestion}
        images={previewQuestion ? getQuestionImages(previewQuestion.id) : []}
        onClose={() => setPreviewQuestion(null)}
      />

      <MarkSchemeModal
        question={markSchemeQuestion}
        images={markSchemeQuestion ? getMarkSchemeImages(markSchemeQuestion.id) : []}
        onClose={() => setMarkSchemeQuestion(null)}
      />

      <PdfProgressOverlay icon={pdfProgress?.icon} message={pdfProgress?.message} />
    </>
  );
}
