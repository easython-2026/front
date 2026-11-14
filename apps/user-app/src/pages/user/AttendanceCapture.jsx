
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useGeolocation from "../../hooks/useGeolocation";
import { checkLocation, clockIn, clockOut } from "../../api/attendance";
import { FeatureButton, FeatureIcon, FeatureNotice, displayKst, errorText, unwrap } from "../../components/WorkerFeatureUI";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];

export default function AttendanceCapture() {
  const { type } = useParams();
  const navigate = useNavigate();
  const isIn = type === "clock-in";
  const valid = isIn || type === "clock-out";
  const title = isIn ? "출근" : "퇴근";
  const action = isIn ? "CLOCK_IN" : "CLOCK_OUT";
  const { getCurrentLocation, loading: locating, error: positionError } = useGeolocation();
  const [gps, setGps] = useState("checking");
  const [verificationToken, setVerificationToken] = useState("");
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [verifiedExpiresAt, setVerifiedExpiresAt] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef("");

  const releaseCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const clearPhoto = useCallback(() => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreview("");
    setPhoto(null);
  }, []);

  const verifyGps = useCallback(async () => {
    setGps("checking");
    setError("");
    setVerificationToken("");
    setVerifiedExpiresAt(null);
    clearPhoto();
    try {
      const coords = await getCurrentLocation();
      setGpsAccuracy(coords.accuracy);
      const result = unwrap(await checkLocation({
        type: action,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy,
      }));
      if (result?.verified === false) {
        const reasons = {
          OUT_OF_RANGE: "등록된 근무장소의 인증 반경 밖에 있습니다.",
          LOW_ACCURACY: "GPS 위치 정확도가 낮습니다. 다시 시도해 주세요.",
          NO_WORKPLACE: "먼저 근무장소를 등록해 주세요.",
        };
        throw new Error(reasons[result.failReason] || "GPS 위치 인증에 실패했습니다.");
      }
      if (result?.verified !== true || !result?.verificationToken) {
        throw new Error("서버에서 근무장소 인증 토큰을 받지 못했습니다.");
      }
      setVerifiedExpiresAt(result.expiresAt ?? null);
      setVerificationToken(result.verificationToken);
      setGps("success");
    } catch (e) {
      setGps(e?.message?.includes("권한") ? "denied" : "failed");
      setError(errorText(e));
    }
  }, [getCurrentLocation, action, clearPhoto]);

  useEffect(() => {
    if (valid) verifyGps();
  }, [valid, verifyGps]);

  useEffect(() => {
    if (gps !== "success" || photo || receipt) return undefined;
    let cancelled = false;
    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("실시간 카메라를 사용할 수 없습니다. 사진 촬영 버튼에서 카메라를 실행해 주세요.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraError("");
      } catch {
        setCameraError("실시간 카메라 권한을 허용하거나 사진 촬영 버튼으로 이미지를 선택해 주세요.");
      }
    }
    openCamera();
    return () => { cancelled = true; releaseCamera(); };
  }, [gps, photo, receipt, releaseCamera]);

  useEffect(() => () => {
    releaseCamera();
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, [releaseCamera]);

  function usePhoto(file) {
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      setError("5MB 이하의 JPG 또는 PNG 이미지만 사용할 수 있습니다.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
    setPhoto(file);
    setError("");
    releaseCamera();
  }

  function takePhoto() {
    if (gps !== "success" || !verificationToken) return;
    const video = videoRef.current;
    if (!video?.videoWidth || !streamRef.current) {
      fileInputRef.current?.click();
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) usePhoto(new File([blob], "workplace.jpg", { type: "image/jpeg" }));
      else setError("사진 처리에 실패했습니다. 다시 촬영해 주세요.");
    }, "image/jpeg", 0.88);
  }

  async function save() {
    if (gps !== "success" || !verificationToken || !photo || saving) return;
    if (verifiedExpiresAt && new Date(verifiedExpiresAt).getTime() <= Date.now()) {
      setError("GPS 인증 시간이 만료되었습니다. 다시 위치 인증해 주세요.");
      setGps("failed");
      setVerificationToken("");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Photo capture should be accompanied by its own current location sample.
      // Do not reuse old coordinates if the location permission was revoked.
      const coords = await getCurrentLocation();
      if (!coords || !Number.isFinite(coords.accuracy)) {
        throw new Error("촬영 시점의 위치 정보가 필요합니다.");
      }
      const form = new FormData();
      form.append("verificationToken", verificationToken);
      form.append("photo", photo, photo.name);
      form.append("latitude", String(coords.latitude));
      form.append("longitude", String(coords.longitude));
      form.append("accuracyMeters", String(coords.accuracy));
      form.append("clientCapturedAt", new Date().toISOString());
      const result = unwrap(await (isIn ? clockIn(form) : clockOut(form)));
      setReceipt(result ?? {});
      releaseCamera();
    } catch (e) {
      setError(errorText(e));
      // 인증 토큰 만료 가능성을 고려해 재인증을 요구
      setVerificationToken("");
      setGps("failed");
    } finally {
      setSaving(false);
    }
  }

  if (!valid) return <main className="ef-page"><FeatureNotice tone="error">출퇴근 유형이 올바르지 않습니다.</FeatureNotice><Link to="/attendance">출퇴근 관리로 돌아가기</Link></main>;

  if (receipt) return <main className="ef-page ef-complete">
    <div className="ef-success-symbol"><FeatureIcon name="check" size={44}/></div>
    <p className="ef-eyebrow">{title} 기록 완료</p>
    <h1>{isIn ? "안전한 하루를 시작해요" : "오늘도 수고 많으셨어요"}</h1>
    <p>사진과 GPS 인증 정보가 서버에 저장되었습니다.</p>
    <section className="ef-card"><div className="ef-info-row"><span>기록 유형</span><b>{title}</b></div><div className="ef-info-row"><span>서버 기록 시각</span><b>{displayKst(receipt.clockInAt ?? receipt.clockOutAt ?? receipt.recordedAt ?? receipt.serverTimestamp)}</b></div><div className="ef-info-row"><span>GPS 인증</span><b>완료</b></div></section>
    <FeatureButton onClick={() => navigate("/home", { replace: true })}>홈으로 돌아가기</FeatureButton>
  </main>;

  return <main className="ef-camera-screen">
    <header className="ef-camera-header"><Link to="/home" aria-label="뒤로 가기"><FeatureIcon name="arrow"/></Link><div><b>{title} 인증</b><span>{isIn ? "근무 시작 기록" : "근무 종료 기록"}</span></div><span/></header>
    <div className="ef-camera-preview">
      <video ref={videoRef} autoPlay muted playsInline className="ef-camera-video" />
      {preview && <img className="ef-camera-video" src={preview} alt="촬영한 현장 사진" />}
      <div className="ef-camera-guide"><i/><i/><i/><i/></div>
      <div className="ef-camera-copy"><b>근무 장소가 보이도록 촬영해 주세요</b><span>GPS 인증 후 촬영 버튼이 활성화됩니다</span></div>
      <div className={`ef-gps-panel ef-gps-${gps}`}>
        <div className="ef-gps-icon">{gps === "success" ? <FeatureIcon name="check"/> : gps === "checking" ? <i className="ef-spinner"/> : <FeatureIcon name="alert"/>}</div>
        <div><b>{gps === "success" ? "근무장소 인증 완료" : gps === "checking" ? "GPS 위치를 확인하고 있어요" : gps === "denied" ? "위치 권한이 거부되었어요" : "근무장소를 인증할 수 없어요"}</b><span>{gps === "success" ? `서버 인증 성공 · 정확도 약 ${Math.round(gpsAccuracy ?? 0)}m` : gps === "checking" ? "위치 권한 · 정확도 · 등록 장소 비교 중" : "위치 권한·GPS·등록된 근무장소를 확인해 주세요"}</span></div>
      </div>
    </div>
    {error && <div className="ef-camera-error" role="alert"><FeatureIcon name="alert" size={17}/>{error}</div>}
    {positionError && !error && <div className="ef-camera-error" role="alert">{positionError}</div>}
    {cameraError && gps === "success" && !photo && <p className="ef-camera-hint">{cameraError}</p>}
    <div className="ef-camera-controls">
      {(gps === "failed" || gps === "denied") && <FeatureButton variant="secondary" disabled={locating} onClick={verifyGps}><FeatureIcon name="refresh"/> GPS 재인증</FeatureButton>}
      <input ref={fileInputRef} className="ef-visually-hidden" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(e) => { usePhoto(e.target.files?.[0]); e.target.value = ""; }}/>
      <button type="button" aria-label="사진 촬영" className={`ef-shutter ${gps === "success" ? "enabled" : ""}`} disabled={gps !== "success" || saving || Boolean(photo)} onClick={takePhoto}><span/></button>
      <small>{gps === "success" ? `${title} 사진 촬영` : "GPS 인증 전에는 촬영할 수 없어요"}</small>
    </div>
    {photo && <div className="ef-capture-sheet"><img src={preview} alt="촬영 결과 미리보기"/><div><b>사진이 선명하게 촬영되었나요?</b><span>GPS 인증 정보와 함께 서버로 저장해요.</span></div><FeatureButton variant="secondary" disabled={saving} onClick={clearPhoto}>다시 촬영</FeatureButton><FeatureButton disabled={saving} onClick={save}>{saving ? "서버에 저장 중..." : "기록 저장"}</FeatureButton></div>}
  </main>;
}
