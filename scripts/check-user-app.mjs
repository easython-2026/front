
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const SRC = path.join(ROOT, "apps", "user-app", "src");

const endpointFile = path.join(SRC, "api", "endpoints.js");
const appFile = path.join(SRC, "App.jsx");

let errorCount = 0;
let warningCount = 0;

function error(message) {
  errorCount += 1;
  console.error(`❌ ${message}`);
}

function warn(message) {
  warningCount += 1;
  console.warn(`⚠️ ${message}`);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function getFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, {
    withFileTypes: true,
  }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getFiles(fullPath);
    }

    if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      return [fullPath];
    }

    return [];
  });
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

// -----------------------------------------
// 1. 필수 파일 확인
// -----------------------------------------

console.log("\n=== 1. 필수 파일 확인 ===");

const requiredFiles = [
  "App.jsx",
  "api/client.js",
  "api/endpoints.js",
  "layouts/UserLayout.jsx",
  "pages/user/Home.jsx",
  "pages/user/Salary.jsx",
  "pages/user/SalaryStatement.jsx",
  "pages/user/SalaryComparison.jsx",
  "pages/user/Consultations.jsx",
  "pages/user/ConsultationDetail.jsx",
  "pages/user/Notifications.jsx",
  "pages/user/Profile.jsx",
  "pages/user/PrivacySettings.jsx",
  "pages/user/Workplace.jsx",
];

for (const file of requiredFiles) {
  const fullPath = path.join(SRC, file);

  if (fs.existsSync(fullPath)) {
    pass(file);
  } else {
    error(`파일 없음: ${file}`);
  }
}

if (
  !fs.existsSync(endpointFile) ||
  !fs.existsSync(appFile)
) {
  console.error("\n필수 검사 파일이 없어 종료합니다.");
  process.exit(1);
}

// -----------------------------------------
// 2. endpoints.js 액션 목록 수집
// -----------------------------------------

console.log("\n=== 2. API 엔드포인트 검사 ===");

const endpointSource = read(endpointFile);
const endpointActions = new Set();

let currentGroup = null;

for (const line of endpointSource.split(/\r?\n/)) {
  const groupMatch = line.match(
    /^  ([A-Za-z_$][\w$]*):\s*\{\s*$/
  );

  if (groupMatch) {
    currentGroup = groupMatch[1];
    continue;
  }

  const actionMatch = line.match(
    /^    ([A-Za-z_$][\w$]*):\s*\{\s*$/
  );

  if (currentGroup && actionMatch) {
    endpointActions.add(
      `${currentGroup}.${actionMatch[1]}`
    );
  }
}

pass(`${endpointActions.size}개 API 액션 발견`);

const sourceFiles = getFiles(SRC);
let apiCalls = 0;

const callPattern =
  /\bapiRequest\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g;

for (const file of sourceFiles) {
  const source = read(file);

  for (const match of source.matchAll(callPattern)) {
    const action = `${match[1]}.${match[2]}`;
    apiCalls += 1;

    if (!endpointActions.has(action)) {
      error(
        `${relative(file)}에서 정의되지 않은 API 호출: ${action}`
      );
    }
  }
}

pass(`${apiCalls}개 정적 API 호출 검사 완료`);

// -----------------------------------------
// 3. App.jsx 라우트 검사
// -----------------------------------------

console.log("\n=== 3. 라우트 검사 ===");

const appSource = read(appFile);

const routes = [
  ...appSource.matchAll(
    /\bpath=["']([^"']+)["']/g
  ),
].map((match) => match[1]);

pass(`${routes.length}개 라우트 발견`);

function normalizeRoute(route) {
  return route
    .split("/")
    .map((part) =>
      part.startsWith(":") ? ":param" : part
    )
    .join("/");
}

const routePatterns = new Map();

for (const route of routes) {
  if (route === "*") continue;

  const normalized = normalizeRoute(route);

  if (routePatterns.has(normalized)) {
    error(
      `라우트 충돌: ${routePatterns.get(normalized)} ↔ ${route}`
    );
  } else {
    routePatterns.set(normalized, route);
  }
}

// -----------------------------------------
// 4. 정적 Link 및 navigate 경로 검사
// -----------------------------------------

console.log("\n=== 4. 페이지 이동 검사 ===");

function routeMatches(urlPath) {
  const pathname = urlPath.split("?")[0].split("#")[0];

  return routes.some((route) => {
    if (route === "*") return false;

    const routeParts = route.split("/");
    const urlParts = pathname.split("/");

    if (routeParts.length !== urlParts.length) {
      return false;
    }

    return routeParts.every((part, index) => {
      return (
        part.startsWith(":") ||
        part === urlParts[index]
      );
    });
  });
}

let checkedLinks = 0;

const linkPattern = /\bto=["'](\/[^"']*)["']/g;
const navigatePattern =
  /\bnavigate\(\s*["'](\/[^"']*)["']/g;

for (const file of sourceFiles) {
  const source = read(file);

  const matches = [
    ...source.matchAll(linkPattern),
    ...source.matchAll(navigatePattern),
  ];

  for (const match of matches) {
    const target = match[1];

    if (target.includes("*")) continue;

    checkedLinks += 1;

    if (!routeMatches(target)) {
      warn(
        `${relative(file)}: 라우트 확인 필요 → ${target}`
      );
    }
  }
}

pass(`${checkedLinks}개 정적 이동 경로 확인`);

// -----------------------------------------
// 5. 결과
// -----------------------------------------

console.log("\n=== 검사 결과 ===");
console.log(`오류: ${errorCount}개`);
console.log(`확인 필요: ${warningCount}개`);

console.log(
  "\n참고: 템플릿 문자열의 동적 링크, API 응답, " +
  "실제 서버 동작은 별도 테스트가 필요합니다."
);

if (errorCount > 0) {
  console.error("\n통합 검사 실패");
  process.exitCode = 1;
} else {
  console.log("\n정적 통합 검사 통과");
}
