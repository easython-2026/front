
import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  AuthButton,
  AuthIcon,
} from "./AuthUI";

import BrandLogo from "../../components/BrandLogo";

const slides = [
  {
    kicker: "내가 일한 시간을, 내 손에",
    title: "일한 기록이\n든든한 증거가 됩니다",
    text: "GPS와 사진으로 출퇴근을 기록하고 원본 기록을 안전하게 남겨요.",
    icon: "clock",
    cardLabel: "오늘의 근무",
    cardValue: "기록 전",
    firstChipIcon: "check",
    firstChip: "원본 기록 보존",
    secondChipIcon: "language",
    secondChip: "GPS · 사진 인증",
  },
  {
    kicker: "복잡한 계약서도 쉽게",
    title: "계약 조건을\n내 언어로 확인해요",
    text: "계약서를 촬영하면 OCR로 조건을 분석하고, 원문과 번역문을 함께 보며 확인이 필요한 조항을 살펴볼 수 있어요.",
    icon: "file",
    cardLabel: "계약 조건 확인",
    cardValue: "번역 완료",
    firstChipIcon: "camera",
    firstChip: "촬영 · OCR 분석",
    secondChipIcon: "language",
    secondChip: "번역 · 조항 확인",
  },
  {
    kicker: "받아야 할 금액을 한눈에",
    title: "일한 만큼 받았는지\n함께 비교해요",
    text: "예상 임금과 실제 지급액을 비교하고, 필요한 경우 진정서 초안을 만들거나 상담을 연결해요.",
    icon: "wallet",
    cardLabel: "월 급여 비교",
    cardValue: "확인 필요",
    firstChipIcon: "report",
    firstChip: "예상 · 실제 비교",
    secondChipIcon: "message",
    secondChip: "진정 · 상담 연결",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const slide = slides[step];

  function handleNext() {
    if (step < slides.length - 1) {
      setStep((previous) => previous + 1);
    } else {
      navigate("/signup");
    }
  }

  return (
    <div className="eth-auth-root">
      <div className="eth-auth-intro">

        {/* ====================================
            온보딩 상단 로고
        ==================================== */}

        <header className="eth-auth-intro-top">
          <BrandLogo size="intro" />
        </header>

        {/* ====================================
            중앙 소개 일러스트
        ==================================== */}

        <div
          className="eth-auth-hero"
          aria-hidden="true"
        >
          <div className="eth-auth-orbit eth-auth-orbit-one" />

          <div className="eth-auth-orbit eth-auth-orbit-two" />

          <div className="eth-auth-visual-card">
            <AuthIcon
              name={slide.icon}
              size={52}
            />

            <span>
              {slide.cardLabel}
            </span>

            <strong>
              {slide.cardValue}
            </strong>
          </div>

          <div className="eth-auth-chip eth-auth-chip-a">
            <AuthIcon
              name={slide.firstChipIcon}
            />

            {slide.firstChip}
          </div>

          <div className="eth-auth-chip eth-auth-chip-b">
            <AuthIcon
              name={slide.secondChipIcon}
            />

            {slide.secondChip}
          </div>
        </div>

        {/* ====================================
            소개 문구 및 버튼
        ==================================== */}

        <main className="eth-auth-intro-copy">
          <p className="eth-auth-eyebrow">
            {slide.kicker}
          </p>

          <h1>
            {slide.title}
          </h1>

          <p className="eth-auth-intro-description">
            {slide.text}
          </p>

          {/* 페이지 진행 점 */}
          <div
            className="eth-auth-dots"
            aria-label={`소개 ${step + 1} / ${slides.length}`}
          >
            {slides.map((item, index) => (
              <i
                key={item.kicker}
                className={
                  index === step ? "active" : ""
                }
              />
            ))}
          </div>

          {/* 다음 / 시작하기 */}
          <AuthButton onClick={handleNext}>
            {step < slides.length - 1
              ? "다음"
              : "시작하기"}

            {step < slides.length - 1 && (
              <AuthIcon name="chevron" />
            )}
          </AuthButton>

          {/* 로그인 */}
          <Link
            to="/login"
            className="eth-auth-text-link"
          >
            이미 계정이 있어요 · 로그인
          </Link>
        </main>
      </div>
    </div>
  );
}
