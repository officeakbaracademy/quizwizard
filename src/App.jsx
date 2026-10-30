import { useCallback, useEffect, useMemo, useState } from 'react';

import CourseBar from './components/CourseBar';
import FilterPanel from './components/FilterPanel';
import Icon from './components/Icon';
import MarkSchemeModal from './components/MarkSchemeModal';
import PdfProgressOverlay from './components/PdfProgressOverlay';
import PreviewModal from './components/PreviewModal';
import QuestionsTable from './components/QuestionsTable';
import StatsGrid from './components/StatsGrid';
import SubjectLauncher from './components/SubjectLauncher';
import TopBar from './components/TopBar';
import NoticeModal from './components/NoticeModal';
import Pagination from './components/Pagination';
import WorksheetModal from './components/WorksheetModal';
import WorksheetOptions from './components/WorksheetOptions';

import { searchBackendQuestions } from './api/questions';
import { pickQuestionsByMarks, sortQuestionsByMarks } from './api/worksheets';
import { useCatalog } from './hooks/useCatalog';
import { useQuestionBank } from './hooks/useQuestionBank';
import { useTheme } from './hooks/useTheme';
import { getSubject } from './lib/brand';
import {
  EMPTY_COURSE,
  EMPTY_FILTERS,
  buildCatalogue,
  questionsForCourse,
  summariseBank,
  totalMarksOf,
  uniqueSyllabuses,
} from './lib/questionBank';

const TABLE_PAGE_SIZE = 20;

export default function App() {
  const { theme, setTheme } = useTheme();

  const [course, setCourse] = useState(EMPTY_COURSE);

  // The catalog API says which courses exist; the chosen course's questions
  // load once its subject, board and level are picked.
  const { catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } = useCatalog();
  const {
    questions,
    loading: bankLoading,
    error: bankError,
    reload: reloadBank,
    getQuestionImages,
    getMarkSchemeImages,
    hasMarkScheme,
  } = useQuestionBank(course);
  const error = catalogError || bankError;
  const reload = catalogError ? reloadCatalog : reloadBank;
  const [view, setView] = useState('launcher');

  // Switching between the course picker and the question bank always starts
  // at the top of the new page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  // The table shows the results 20 at a time.
  const [tablePage, setTablePage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [targetMarks, setTargetMarks] = useState('');

  const [worksheetQuestions, setWorksheetQuestions] = useState([]);
  const [includeMarkSchemes, setIncludeMarkSchemes] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [markSchemeQuestion, setMarkSchemeQuestion] = useState(null);
  const [pdfProgress, setPdfProgress] = useState(null);
  // The pop-up message shown in place of a browser alert.
  const [notice, setNotice] = useState(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  // Filters the current results came from, sent with worksheet requests.
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const catalogue = useMemo(() => buildCatalogue(catalog), [catalog]);

  const courseQuestions = useMemo(
    () => questionsForCourse(questions, course),
    [questions, course],
  );

  // Every course change starts from a clean slate.
  useEffect(() => {
    setResults(courseQuestions);
    setFilters(EMPTY_FILTERS);
    setSelectedIds(new Set());
  }, [courseQuestions]);

  // New results (a filter, a sort, another course) start again on page 1.
  useEffect(() => {
    setTablePage(1);
  }, [results]);

  const pageQuestions = useMemo(
    () => results.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE),
    [results, tablePage],
  );

  // Changing page brings the top of the table back into view.
  const handlePageChange = useCallback((page) => {
    setTablePage(page);
    document.getElementById('resultsCount')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // The cards describe what's on screen, so they follow the filters.
  const stats = useMemo(() => summariseBank(results), [results]);
  const syllabuses = useMemo(() => uniqueSyllabuses(courseQuestions), [courseQuestions]);
  // The Paper and Topic drop-downs come from the catalog, for the open course.
  const { papers, topics } = catalogue.course(course.subject, course.level, course.board) || {
    papers: [],
    topics: [],
  };

  const selectedQuestions = useMemo(
    () => courseQuestions.filter((question) => selectedIds.has(question.id)),
    [courseQuestions, selectedIds],
  );

  const allFilteredSelected =
    results.length > 0 && results.every((question) => selectedIds.has(question.id));

  const subject = getSubject(course.subject);
  const paperTitle = subject ? `${course.level ? `${course.level} ` : ''}${subject.name}` : 'Worksheet';
  const paperSubtitle = course.board
    ? `${course.board} · Akbar Academy · A Class Above the Rest`
    : 'Akbar Academy';
  const fileSlug = [course.level, course.subject, course.board]
    .filter(Boolean)
    .join('_')
    .toLowerCase();

  /* ---------------------------------------------------------------- */
  /* Course selection                                                  */
  /* ---------------------------------------------------------------- */

  const handleCourseChange = useCallback((key, value) => {
    setCourse((previous) => {
      // Changing a step upstream invalidates everything after it.
      if (key === 'subject') return { subject: value, level: '', board: '' };
      if (key === 'board') return { ...previous, board: value, level: '' };
      return { ...previous, [key]: value };
    });
  }, []);

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

  const handleApplyFilters = useCallback(async () => {
    setAppliedFilters(filters);
    // The search API decides which questions match.
    try {
      setResults(await searchBackendQuestions(filters, courseQuestions));
    } catch (searchError) {
      console.error('Filter search failed:', searchError);
      setNotice({ tone: 'error', title: "Couldn't filter the questions", message: 'Please try again.' });
    }
  }, [courseQuestions, filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setResults(courseQuestions);
  }, [courseQuestions]);

  // Every worksheet action is done by the backend. Until an endpoint exists,
  // its function in api/worksheets.js throws and the teacher sees why.
  const showApiError = useCallback((apiError) => {
    console.error(apiError);
    setNotice({
      tone: 'error',
      title: 'Something went wrong',
      message: apiError.message || 'Please try again.',
    });
  }, []);

  /** Puts results in the order of the ids the API returns. */
  const orderResults = useCallback(
    (ids) => {
      const byId = new Map(courseQuestions.map((q) => [q.id, q]));
      return ids.map((id) => byId.get(id)).filter(Boolean);
    },
    [courseQuestions],
  );

  const handleSortByMarks = useCallback(async () => {
    try {
      const ids = await sortQuestionsByMarks({ filters: appliedFilters, questions: courseQuestions });
      setResults(orderResults(ids));
    } catch (apiError) {
      showApiError(apiError);
    }
  }, [appliedFilters, courseQuestions, orderResults, showApiError]);

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

  const handleGenerateByMarks = useCallback(async () => {
    const target = parseInt(targetMarks, 10);

    if (!target || target <= 0) {
      setNotice({
        title: 'Enter a number of marks',
        message: 'Type how many marks the worksheet should add up to, for example 40.',
      });
      return;
    }

    try {
      const pick = await pickQuestionsByMarks({
        filters: appliedFilters,
        questions: courseQuestions,
        targetMarks: target,
      });
      if (pick.ids.length === 0) {
        setNotice({
          title: 'No questions found',
          message: 'No questions with marks match these filters. Try widening them.',
        });
        return;
      }
      if (!pick.targetReached) {
        setNotice({
          tone: 'info',
          title: 'Fewer marks than you asked for',
          message: `These filters only have ${pick.selectedMarks} marks of questions, so the worksheet uses all of them.`,
        });
      }
      setWorksheetQuestions(orderResults(pick.ids));
    } catch (apiError) {
      showApiError(apiError);
    }
  }, [targetMarks, appliedFilters, courseQuestions, orderResults, showApiError]);

  const handleGenerateFromSelection = useCallback(() => {
    if (selectedQuestions.length === 0) {
      setNotice({
        title: 'No questions selected',
        message: 'Tick at least one question using the checkboxes.',
      });
      return;
    }
    setWorksheetQuestions(selectedQuestions);
  }, [selectedQuestions]);

  const handleCloseWorksheet = useCallback(() => setWorksheetQuestions([]), []);

  /* ---------------------------------------------------------------- */
  /* PDF downloads                                                     */
  /* ---------------------------------------------------------------- */

  const handleDownloadWorksheet = useCallback(async () => {
    setPdfProgress('Preparing the worksheet PDF...');
    // Built here from the questions, marks and page images the API sent.
    try {
      // jsPDF is a large dependency, so it only loads when a download starts.
      const { downloadWorksheetPdf } = await import('./lib/pdf/worksheetPdf');
      await downloadWorksheetPdf({
        questions: worksheetQuestions,
        getQuestionImages,
        getMarkSchemeImages,
        includeMarkSchemes,
        title: paperTitle,
        subtitle: paperSubtitle,
        fileSlug,
        onProgress: setPdfProgress,
      });
    } catch (pdfError) {
      console.error('Worksheet PDF generation error:', pdfError);
      setNotice({
        tone: 'error',
        title: "Couldn't download the worksheet",
        message: 'Please try again.',
        detail: pdfError?.message,
      });
    } finally {
      setPdfProgress(null);
    }
  }, [
    worksheetQuestions,
    getQuestionImages,
    getMarkSchemeImages,
    includeMarkSchemes,
    paperTitle,
    paperSubtitle,
    fileSlug,
  ]);

  const handleDownloadMarkScheme = useCallback(async () => {
    setPdfProgress('Preparing the mark scheme PDF...');
    try {
      const { downloadMarkSchemePdf } = await import('./lib/pdf/markSchemePdf');
      await downloadMarkSchemePdf({
        questions: worksheetQuestions,
        getMarkSchemeImages,
        title: paperTitle,
        subtitle: paperSubtitle,
        fileSlug,
        onProgress: setPdfProgress,
      });
    } catch (pdfError) {
      console.error('Markscheme PDF generation error:', pdfError);
      setNotice({
        tone: 'error',
        title: "Couldn't download the mark scheme",
        message: 'Please try again.',
        detail: pdfError?.message,
      });
    } finally {
      setPdfProgress(null);
    }
  }, [worksheetQuestions, getMarkSchemeImages, paperTitle, paperSubtitle, fileSlug]);

  /* ---------------------------------------------------------------- */

  const showBank = view === 'bank' && courseQuestions.length > 0;

  return (
    <div className="app">
      <TopBar theme={theme} onSetTheme={setTheme} />

      <main className="page">
        <div className="shell">
          {error ? (
            <div className="state-card">
              <h3>
                {error.studentCheck
                  ? "Couldn't check your subjects"
                  : 'The question bank could not be loaded'}
              </h3>
              <p>
                {error.studentCheck
                  ? `The school server said: ${error.message}`
                  : 'The question bank server may be offline. Please try again in a moment.'}
              </p>
              <button type="button" className="btn btn-primary" onClick={reload}>
                <Icon name="reset" size={17} />
                Try again
              </button>
            </div>
          ) : catalogLoading || (view === 'bank' && bankLoading) ? (
            <div className="state-card">
              <span className="spinner" />
              <h3>{catalogLoading ? 'Loading the courses' : 'Loading the question bank'}</h3>
              <p>
                {catalogLoading
                  ? 'Checking which subjects, boards and levels are ready.'
                  : 'Pulling in questions, mark schemes and scanned pages.'}
              </p>
            </div>
          ) : !showBank ? (
            <SubjectLauncher
              course={course}
              catalogue={catalogue}
              loading={catalogLoading}
              onChange={handleCourseChange}
              onOpen={() => setView('bank')}
            />
          ) : (
            <>
              <section className="section">
                <CourseBar
                  course={course}
                  questionCount={courseQuestions.length}
                  onChange={() => setView('launcher')}
                />
              </section>

              <section className="section">
                <StatsGrid
                  totalQuestions={stats.totalQuestions}
                  papers={stats.papers}
                  topics={stats.topics}
                  totalMarks={stats.totalMarks}
                />
              </section>

              <section className="section panel-grid">
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
              </section>

              <section className="section">
                <div className="results-header">
                  <div className="results-count" id="resultsCount">
                    <b>{results.length}</b> questions,{' '}
                    <span className="marks">{totalMarksOf(results)} marks</span>
                    <span className="results-count-tail"> available</span>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleSortByMarks}>
                    <Icon name="sort" size={16} />
                    Sort by marks
                  </button>
                </div>

                <QuestionsTable
                  questions={pageQuestions}
                  selectedIds={selectedIds}
                  allSelected={allFilteredSelected}
                  onToggleQuestion={handleToggleQuestion}
                  onToggleSelectAll={handleToggleSelectAll}
                  onPreview={setPreviewQuestion}
                  onViewMarkScheme={setMarkSchemeQuestion}
                  hasMarkScheme={hasMarkScheme}
                />

                <Pagination
                  page={tablePage}
                  pageSize={TABLE_PAGE_SIZE}
                  total={results.length}
                  onPageChange={handlePageChange}
                />
              </section>
            </>
          )}
        </div>
      </main>

      <WorksheetModal
        questions={worksheetQuestions}
        paperTitle={paperTitle}
        paperSubtitle={paperSubtitle}
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

      <PdfProgressOverlay message={pdfProgress} />
      <NoticeModal notice={notice} onClose={closeNotice} />
    </div>
  );
}
