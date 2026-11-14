/**
 * 명세서의 GET /api/v1/payroll/comparisons 응답을 기존 홈/급여 UI에 연결한다.
 * 스크린샷에는 반환 JSON 스키마가 없으므로 목록/월 요약의 공통 형태만 지원한다.
 * 조회되지 않은 명세서를 '미제출'로 단정하지 않는다.
 */
export function unwrapPayroll(response) {
  return response?.data ?? response;
}

function asList(data) {
  if (Array.isArray(data)) return data;
  for (const value of [data?.comparisons, data?.content, data?.items, data?.results]) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

function pickMonth(item) {
  return item?.month ?? item?.payrollMonth ?? item?.targetMonth ??
    item?.workMonth ?? item?.comparison?.month ?? null;
}

function pickId(item) {
  return item?.comparisonId ?? item?.id ?? item?.comparison?.comparisonId ?? item?.comparison?.id ?? null;
}

function normalizeComparison(item) {
  const source = item?.comparison && typeof item.comparison === 'object'
    ? item.comparison : item;
  const id = pickId(source) ?? pickId(item);
  return {
    ...source,
    id,
    comparisonId: id,
    status: source?.status ?? source?.resultStatus ?? source?.comparisonStatus ?? null,
  };
}

export function payrollOverviewFromComparisons(response, month) {
  const data = unwrapPayroll(response);

  // 서버 응답(월 상태 객체): { month, state, statementId, payday, comparison }
  if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.state === 'string') {
    return {
      month: data.month ?? month,
      status: data.state, // NOT_SUBMITTED | READY | COMPARED
      statementId: data.statementId ?? null,
      payday: data.payday ?? null,
      comparison: data.comparison ? normalizeComparison(data.comparison) : null,
    };
  }

  const list = asList(data);

  if (list === null && (!data || typeof data !== 'object' || Array.isArray(data))) {
    throw new Error('급여 비교 조회 응답 형식을 확인할 수 없습니다. 서버 Response JSON을 확인해 주세요.');
  }

  // 서버가 월 요약 객체를 직접 반환하는 경우도 지원하되, 월이 일치할 때만 사용한다.
  const direct = list === null && pickMonth(data) === month ? data : null;
  if (list === null && !direct) {
    // 응답 구조가 명시되지 않았으므로 임의로 빈 목록으로 처리하지 않는다.
    throw new Error('GET /payroll/comparisons 응답의 목록/월 필드를 확인할 수 없습니다. 서버 응답 명세가 필요합니다.');
  }

  const matches = direct ? [direct] : list.filter((item) => pickMonth(item) === month);
  const newest = [...matches].sort((a, b) => {
    const x = Date.parse(a?.createdAt ?? a?.updatedAt ?? '') || 0;
    const y = Date.parse(b?.createdAt ?? b?.updatedAt ?? '') || 0;
    return y - x;
  })[0] ?? null;

  if (!newest) return {
    month,
    status: 'NOT_COMPARED',
    comparison: null,
    statementId: null,
  };

  const comparison = normalizeComparison(newest);
  return {
    month,
    status: 'COMPARED',
    comparison,
    statementId: newest?.statementId ?? newest?.salaryStatementId ??
      newest?.comparison?.statementId ?? null,
  };
}